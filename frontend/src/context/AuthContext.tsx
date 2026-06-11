"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/profile");
          if (res.data?.success) {
            setUser(res.data.data);
          } else {
            setUser(res.data);
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
