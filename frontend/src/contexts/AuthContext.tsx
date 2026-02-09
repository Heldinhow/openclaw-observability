import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login, logout, validateToken, getUsername } from '../services/api.js';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await validateToken();
      setIsAuthenticated(valid);
      if (valid) {
        setUsername(getUsername());
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = async (user: string, pass: string) => {
    await login(user, pass);
    setIsAuthenticated(true);
    setUsername(getUsername());
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, username, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
