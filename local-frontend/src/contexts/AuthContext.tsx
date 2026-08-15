"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setToken } from "@/lib/apiClient";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  username: string;
  role: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load state from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("feni_user");
    const storedToken = sessionStorage.getItem("feni_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken); // Rehydrate apiClient token
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
    sessionStorage.setItem("feni_user", JSON.stringify(userData));
    sessionStorage.setItem("feni_token", token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("feni_user");
    sessionStorage.removeItem("feni_token");
    router.push("/login");
  };

  // Idle timeout logic
  useEffect(() => {
    if (!user) return; // Only track idle if logged in

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Idle timeout reached. Logging out.");
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    // Setup event listeners for activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer(); // Start the timer initially

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, router]); // Re-run if user changes

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
