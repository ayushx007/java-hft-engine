import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, User, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isConnected }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">TradeFlow</h1>
          <p className="text-xs text-muted-foreground font-mono">Real-Time Trading</p>
        </div>
      </div>

      {/* Center - Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${
            isConnected
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>LIVE</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>DISCONNECTED</span>
            </>
          )}
        </div>
      </div>

      {/* Right - User & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
