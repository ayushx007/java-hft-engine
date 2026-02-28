import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Activity, Lock, User, Loader2, ArrowRight, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from '@/api/axiosConfig';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("login");
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter username and password', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Calls the REAL backend API via AuthContext
      const success = await login(username, password);
      
      if (success) {
        toast({ title: 'Welcome back!', description: `Logged in as ${username}` });
        navigate(from, { replace: true });
      } else {
        toast({ title: 'Login Failed', description: 'Invalid credentials.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login service unavailable', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter username and password', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Call the registration endpoint directly
      await apiClient.post('/api/auth/register', { username, password });
      
      toast({ title: 'Success!', description: 'Account created. You can now login.' });
      setActiveTab("login"); // Switch to login tab
      setPassword(""); 
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background terminal-grid p-4">
      {/* Background Glow Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 glow-buy">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TradeFlow</h1>
          <p className="text-muted-foreground mt-2">Real-Time Trading Terminal</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="login-username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 font-mono" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 font-mono" disabled={isLoading} />
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full font-semibold glow-buy" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Terminal <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Choose Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="reg-username" placeholder="New username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 font-mono" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Choose Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="reg-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 font-mono" disabled={isLoading} />
                  </div>
                </div>
                <Button type="submit" size="lg" variant="secondary" className="w-full font-semibold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <UserPlus className="w-4 h-4 ml-2" /></>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-8">Secure Trading • Real-Time Data • Low Latency</p>
      </div>
    </div>
  );
};

export default LoginPage;