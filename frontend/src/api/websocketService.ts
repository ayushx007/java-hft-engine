import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface TradeUpdate {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
  timestamp: string;
}

type TradeCallback = (trade: TradeUpdate) => void;
type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private tradeCallbacks: TradeCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  connect(): void {
    if (this.client?.connected) {
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          // Uncomment if you need to debug raw STOMP frames
          // console.log('[WS Debug]', str);
        }
      },
      onConnect: () => {
        console.log('[WebSocket] Connected to server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);
        this.subscribeToTrades();
      },
      onDisconnect: () => {
        console.log('[WebSocket] Disconnected from server');
        this.isConnected = false;
        this.notifyConnectionChange(false);
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message']);
        this.isConnected = false;
        this.notifyConnectionChange(false);
      },
      onWebSocketError: (event) => {
        console.error('[WebSocket] Connection error:', event);
        this.handleReconnect();
      },
    });

    this.client.activate();
  }

  /**
   * Internal method to actually subscribe to the STOMP topic once connected.
   */
  private subscribeToTrades(): void {
    if (!this.client?.connected) {
      return;
    }

    this.client.subscribe('/topic/trades', (message: IMessage) => {
      try {
        const trade: TradeUpdate = JSON.parse(message.body);
        this.notifyTradeUpdate(trade);
      } catch (error) {
        console.error('[WebSocket] Failed to parse trade message:', error);
      }
    });

    console.log('[WebSocket] Subscribed to /topic/trades');
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
    }
  }

  private notifyTradeUpdate(trade: TradeUpdate): void {
    this.tradeCallbacks.forEach((callback) => callback(trade));
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  // --- PUBLIC API ---

  /**
   * The new method your Portfolio component is calling.
   * It bridges the generic 'subscribe' call to our specific internal logic.
   */
  subscribe(topic: string, callback: (message: any) => void) {
    if (topic === '/topic/trades') {
       // Bridge the generic subscribe call to our specific trade logic
       // The callback will receive the 'TradeUpdate' object
       this.onTrade((trade) => callback(trade));
    } else {
       console.warn(`[WebSocket] Auto-subscription for topic '${topic}' not manually mapped in this service.`);
       // If you need to support other topics later, you can add generic subscription logic here.
    }
  }

  onTrade(callback: TradeCallback): () => void {
    this.tradeCallbacks.push(callback);
    return () => {
      this.tradeCallbacks = this.tradeCallbacks.filter((cb) => cb !== callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    // Immediately notify of current state
    callback(this.isConnected);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.notifyConnectionChange(false);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();