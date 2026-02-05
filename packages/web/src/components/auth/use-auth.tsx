"use client";

import { useRouter } from "next/navigation";

interface User {
  name?: string;
  email?: string;
}

/**
 * Authentication Hook
 *
 * Provides authentication state and actions
 */
export function useAuth() {
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.push("/account");
      return { success: true };
    }

    const data = await response.json();
    return { success: false, error: data.error || "Login failed" };
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      router.push("/account");
      return { success: true };
    }

    const data = await response.json();
    return { success: false, error: data.error || "Registration failed" };
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // Mock user data - in production, fetch from session
  const user: User = {
    name: "Demo User",
    email: "user@example.com",
  };

  return {
    login,
    register,
    logout,
    user,
    isAuthenticated: true, // In production, check actual session
  };
}
