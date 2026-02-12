import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth always enabled - no login required
  const [isAuthenticated] = useState(true);
  const [isLoading] = useState(false);
  const [username] = useState<string | null>('admin');

  const handleLogin = async (_user: string, _pass: string) => {
    // No-op - already authenticated
  };

  const handleLogout = () => {
    // No-op - always authenticated
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
