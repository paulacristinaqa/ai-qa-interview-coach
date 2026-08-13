"use client";

import { PageHeader } from "../../components/page";
import { useAuth } from "../../components/auth-provider";

export default function SettingsPage() {
  const { user, status, logout } = useAuth();
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Settings" description="Sessao local e configuracao atual do coach." />
      <section className="panel settings-grid">
        <div><span className="helper-text">Usuario</span><h2>{user?.name}</h2><p>{user?.email}</p></div>
        <div><span className="helper-text">Sessao</span><p>{status}</p><button className="danger-button" onClick={logout}>Sair deste navegador</button></div>
        <div><span className="helper-text">API</span><p>{process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3001/api/v1"}</p></div>
      </section>
    </>
  );
}
