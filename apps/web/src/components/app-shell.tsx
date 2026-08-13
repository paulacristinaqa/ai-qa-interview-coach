"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navigationGroups } from "../lib/navigation";
import { LoginScreen, useAuth } from "./auth-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { token, user, isLoading } = useAuth();

  if (isLoading) return <main className="loading-screen">A preparar o seu workspace...</main>;
  if (!token) return <LoginScreen />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">QA</span>
          <span><strong>Interview Coach</strong><small>Evidence-led practice</small></span>
        </Link>
        <nav aria-label="Navegacao principal">
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link className={`nav-item ${active ? "active" : ""}`} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
                    <span className="nav-icon">{item.shortLabel}</span>{item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-user"><span>{user?.name ?? "QA Tester"}</span><small>{user?.email}</small></div>
      </aside>
      <main className="content-shell">{children}</main>
    </div>
  );
}
