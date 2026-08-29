"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { User } from "../lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

interface AuthContextValue {
  token: string;
  user: User | null;
  isLoading: boolean;
  status: string;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { message?: string | string[]; error?: string };
    const message = Array.isArray(data.message) ? data.message.join(" ") : data.message;
    return message ?? data.error ?? `Falha na requisicao: ${response.status}`;
  } catch {
    return `Falha na requisicao: ${response.status}`;
  }
}

async function request<T>(path: string, options: RequestInit = {}, accessToken = "") {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(await readApiError(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Sessao local ainda nao iniciada.");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedToken = window.localStorage.getItem("etqa.accessToken");
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    request<User>("/auth/me", {}, savedToken)
      .then((authenticatedUser) => {
        setToken(savedToken);
        setUser(authenticatedUser);
        setStatus("Sessao restaurada neste navegador.");
      })
      .catch(() => {
        window.localStorage.removeItem("etqa.accessToken");
        setStatus("Sessao anterior expirada. Entre novamente.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const api = useCallback(<T,>(path: string, options: RequestInit = {}) => request<T>(path, options, token), [token]);

  const login = useCallback(async (email: string, password: string) => {
    setError("");
    setIsLoading(true);
    try {
      const data = await request<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      window.localStorage.setItem("etqa.accessToken", data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
      setStatus(`Sessao autenticada para ${data.user.name}.`);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : `Nao foi possivel conectar na API em ${apiBaseUrl}.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("etqa.accessToken");
    window.sessionStorage.removeItem("etqa.interviewSession");
    setToken("");
    setUser(null);
    setStatus("Sessao encerrada neste navegador.");
    setError("");
  }, []);

  const value = useMemo(() => ({ token, user, isLoading, status, error, login, logout, api }), [token, user, isLoading, status, error, login, logout, api]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function LoginScreen() {
  const { login, isLoading, status, error } = useAuth();
  const [email, setEmail] = useState("paula@example.com");
  const [password, setPassword] = useState("change-me-locally");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password);
  }

  return (
    <main className="login-shell">
      <section className="login-copy">
        <p className="eyebrow">AI QA Interview Coach</p>
        <h1>Prepare-se com evidencia.</h1>
        <p>Treino estruturado para entrevistas tecnicas e comportamentais de QA.</p>
      </section>
      <form className="panel auth-panel" onSubmit={submit}>
        <h2>Entrar</h2>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button type="submit" disabled={isLoading}>{isLoading ? "Entrando..." : "Entrar no coach"}</button>
        <p className="helper-text">{status}</p>
        {error ? <p className="status-message" role="alert">{error}</p> : null}
      </form>
    </main>
  );
}
