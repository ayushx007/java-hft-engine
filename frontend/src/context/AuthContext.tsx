import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/api/axiosConfig';

export interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  userId: number;
  username: string;
  token: string;
  message: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Call the Real Backend API
      const response = await apiClient.post<LoginResponse>('/api/auth/login', {
        username,
        password
      });

      const data = response.data;

      // Create user object from response
      const loggedInUser: User = {
        id: data.userId.toString(),
        username: data.username,
        // Backend doesn't store email yet, so we generate a placeholder
        email: `${data.username.toLowerCase()}@trading.io`,
      };

      // Store session data
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      localStorage.setItem('authToken', data.token);
      
      setUser(loggedInUser);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    // Optional: Redirect to login or refresh page
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};