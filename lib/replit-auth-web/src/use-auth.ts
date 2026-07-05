import { useState, useEffect, useCallback } from "react";
import type { AuthUser, BanInfo } from "@workspace/api-client-react";

export type { AuthUser, BanInfo };

interface AuthState {
  user: AuthUser | null;
  ban: BanInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ban, setBan] = useState<BanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ user: AuthUser | null; ban?: BanInfo | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setBan(data.ban ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setBan(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = "/api/logout";
  }, []);

  return {
    user,
    ban,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
