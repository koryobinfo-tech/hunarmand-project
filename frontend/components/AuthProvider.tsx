"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, AuthUser, getStoredAuth, setStoredAuth } from "../lib/api";

type Profile = {
  id: string;
  role: string;
  full_name_or_company: string;
  phone: string;
  passport_number: string;
  inn_number: string;
  birth_date: string;
  avatar_image?: string;
  passport_address?: string;
  residential_address?: string;
  workshop_address?: string;
  tax_registration_number?: string;
  bio?: string;
  craft?: string;
};

type Ctx = {
  auth: AuthUser | null;
  profile: Profile | null;
  ready: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    const stored = getStoredAuth();
    setAuth(stored);
    if (!stored) {
      setProfile(null);
      return;
    }
    try {
      const me = await api.get<Profile>("/auth/me");
      setProfile(me);
    } catch {
      setStoredAuth(null);
      setAuth(null);
      setProfile(null);
    }
  }

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      auth,
      profile,
      ready,
      login: async (phone, password) => {
        const data = await api.post<AuthUser>("/auth/login", { phone, password });
        setStoredAuth(data);
        setAuth(data);
        await refresh();
        return data;
      },
      logout: () => {
        setStoredAuth(null);
        setAuth(null);
        setProfile(null);
      },
      refresh,
    }),
    [auth, profile, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
