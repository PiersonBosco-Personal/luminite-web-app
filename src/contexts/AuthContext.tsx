import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import customAxios from "../lib/customAxios";
import { disconnectEcho, initEcho } from "../lib/echo";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await customAxios.get("/v1/auth/user");
      setUser(response.data);
      initEcho(token);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const response = await customAxios.post("/v1/auth/login", credentials);
      localStorage.setItem('auth_token', response.data.token);
      initEcho(response.data.token);
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await customAxios.post("/v1/auth/logout");
    } catch {
      // token may already be invalid — still clear locally
    } finally {
      disconnectEcho();
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsLoading(false);
      window.location.href = "/";
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        fetchUser,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
