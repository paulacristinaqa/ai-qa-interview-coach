import * as React from "react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function StatusMessage({ message }: { message: string }) {
  return message ? <p className="status-message" role="status">{message}</p> : null;
}

export function EmptyStatePage({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader eyebrow="Career Intelligence" title={title} description={description} />
      <section className="panel empty-state">
        <span className="empty-state-mark">Soon</span>
        <h2>Area preparada</h2>
        <p>Esta rota ja faz parte da navegacao e esta pronta para receber a proxima etapa do produto.</p>
      </section>
    </>
  );
}
