"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Role = "user" | "admin" | "superadmin";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  ready: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, displayName?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
  /** 用于 Header 触发登录/注册 modal */
  openAuthModal: (mode?: "login" | "register") => void;
  /** modal 关闭时调用, 用于触发回调 */
  setAuthModalOpen: (open: boolean, mode?: "login" | "register") => void;
  authModalOpen: boolean;
  authModalMode: "login" | "register";
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (data.ok && data.data.user) {
        setUser(data.data.user);
        setIsAdmin(Boolean(data.data.isAdmin));
        setIsSuperAdmin(Boolean(data.data.isSuperAdmin));
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 跨标签页同步:监听 storage 事件,一处登出,全部登出
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "ml-site-auth-ping") refresh();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const login: AuthContextValue["login"] = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setUser(data.data.user);
        try { localStorage.setItem("ml-site-auth-ping", String(Date.now())); } catch {}
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "登录失败" };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "网络错误" };
    } finally {
      setLoading(false);
    }
  }, []);

  const register: AuthContextValue["register"] = useCallback(
    async (email, password, displayName) => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setUser(data.data.user);
          try { localStorage.setItem("ml-site-auth-ping", String(Date.now())); } catch {}
          return { ok: true };
        }
        return { ok: false, error: data.error ?? "注册失败" };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "网络错误" };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout: AuthContextValue["logout"] = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      try { localStorage.setItem("ml-site-auth-ping", String(Date.now())); } catch {}
      setLoading(false);
    }
  }, []);

  const requestPasswordReset: AuthContextValue["requestPasswordReset"] = useCallback(async (email) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) return { ok: true };
      return { ok: false, error: data.error ?? "请求失败" };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "网络错误" };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword: AuthContextValue["resetPassword"] = useCallback(async (token, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setUser(data.data.user);
        try { localStorage.setItem("ml-site-auth-ping", String(Date.now())); } catch {}
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "重置失败" };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "网络错误" };
    } finally {
      setLoading(false);
    }
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const setAuthModalOpenCb = useCallback((open: boolean, mode?: "login" | "register") => {
    if (mode) setAuthModalMode(mode);
    setAuthModalOpen(open);
  }, []);

  const value: AuthContextValue = {
    user,
    isAdmin,
    isSuperAdmin,
    ready,
    loading,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    refresh,
    openAuthModal,
    setAuthModalOpen: setAuthModalOpenCb,
    authModalOpen,
    authModalMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
