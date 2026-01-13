import axios from 'axios';

// Create a configured Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Trade API types
export interface TradeOrder {
  ticker: string;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
  userId: number; // <--- ADD THIS LINE
}

export interface TradeResponse {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  type: 'BUY' | 'SELL';
  timestamp: string;
  status: 'EXECUTED' | 'PENDING' | 'REJECTED';
}

// Trade API functions
export const tradeApi = {
  placeTrade: async (order: TradeOrder): Promise<TradeResponse> => {
    const response = await apiClient.post<TradeResponse>('/trade', order);
    return response.data;
  },
  getPendingOrders: (userId: number) => apiClient.get<any[]>(`/api/orders/pending/${userId}`),
  getHistory: (userId: number) => apiClient.get<any[]>(`/api/orders/history/${userId}`),
  cancelOrder: (orderId: number) => apiClient.delete(`/api/orders/${orderId}`),
};

export default apiClient;
