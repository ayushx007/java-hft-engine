import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';
import { Activity, LogOut, User, Wifi, WifiOff, LayoutDashboard, History, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  isConnected: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isConnected }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleMobileNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between relative z-50">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight">TradeFlow</h1>
            <p className="text-xs text-muted-foreground font-mono">Real-Time Trading</p>
          </div>
        </div>

        {/* Center - Navigation & Connection Status (Desktop) */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>
              Dashboard
            </NavLink>
            <NavLink to="/order-history" icon={<History className="w-4 h-4" />}>
              Order History
            </NavLink>
          </nav>

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
                <span className="hidden sm:inline">LIVE</span>
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DISCONNECTED</span>
              </>
            )}
          </div>
        </div>

        {/* Right - User & Logout (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
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

        {/* Mobile - User Icon */}
        <div className="md:hidden flex items-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border z-40
        transform transition-transform duration-200 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">Trader</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => handleMobileNavClick('/dashboard')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => handleMobileNavClick('/order-history')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <History className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Order History</span>
            </button>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
