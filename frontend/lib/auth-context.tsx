"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authService from "@/services/auth";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** /me a échoué pour une autre raison qu’une session absente (réseau, 5xx). */
  error: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await authService.getMe();
      setUser(me);
      setError(false);
    } catch (err) {
      setUser(null);
      const status = (err as { status?: number }).status;
      setError(status === undefined || status >= 500);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const { user: me } = await authService.login({ email, password });
    setUser(me);
  };

  const logout = async () => {
    await authService.logout();
    const { signOutFirebase } = await import("@/services/firestore-chat");
    await signOutFirebase().catch(() => undefined);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider.");
  return ctx;
}
