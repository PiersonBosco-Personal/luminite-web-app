import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import customAxios from "../lib/customAxios";

interface User {
  id: number;
  name: string;
  email: string;
  user_role_id: number;
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
    setIsLoading(true);
    try {
      const response = await customAxios.get("/api/v1/auth/user");
      setUser(response.data);
    } catch (error) {
      setUser(null);
      console.error("Not authenticated or error fetching user", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    await customAxios.get("/sanctum/csrf-cookie");
    try {
      const response = await customAxios.post(
        "/api/v1/auth/login",
        credentials,
      );
      setUser(response.data.user);
      // await fetchUser();
    } catch (error) {
      setIsLoading(false);
      console.error("Login failed:", error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await customAxios.post("/api/v1/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
    } finally {
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
