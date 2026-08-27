import * as React from "react";
import type { ApplicationStatus, JobApplication } from "../../../lib/types";

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  planned: "Planejada",
  applied: "Enviada",
  screening: "Triagem",
  interview: "Entrevista",
  technical: "Etapa tecnica",
  offer: "Proposta",
  hired: "Contratada",
  rejected: "Encerrada",
  withdrawn: "Desistida"
};

export function buildApplicationQuery(filters: { search: string; status: string }) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

export function ApplicationSummary({ applications }: { applications: JobApplication[] }) {
  const active = applications.filter((item) => !["hired", "rejected", "withdrawn"].includes(item.status)).length;
  const interviews = applications.filter((item) => ["interview", "technical"].includes(item.status)).length;
  const offers = applications.filter((item) => item.status === "offer").length;
  return (
    <section className="application-summary" aria-label="Resumo do pipeline">
      <article><span>Ativas</span><strong>{active}</strong></article>
      <article><span>Em entrevistas</span><strong>{interviews}</strong></article>
      <article><span>Propostas</span><strong>{offers}</strong></article>
    </section>
  );
}

export function ApplicationCard({ application, onEdit, onDelete }: {
  application: JobApplication;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { opportunity } = application;
  return (
    <article className="application-card">
      <div className="panel-header">
        <div><span className="helper-text">{opportunity.company}</span><h3>{opportunity.title}</h3></div>
        <span className={`status-pill ${application.status}`}>{applicationStatusLabels[application.status]}</span>
      </div>
      <p>{opportunity.city ? `${opportunity.city}, ` : ""}{opportunity.country} / {opportunity.workModel}</p>
      <div className="application-dates">
        <span>Enviada: <strong>{formatDate(application.appliedAt)}</strong></span>
        <span>Proxima acao: <strong>{formatDate(application.nextActionAt)}</strong></span>
      </div>
      {application.nextAction ? <p><strong>{application.nextAction}</strong></p> : <p className="helper-text">Nenhuma proxima acao registrada.</p>}
      {application.notes ? <p className="preserved-text">{application.notes}</p> : null}
      <div className="actions">
        <button type="button" className="ghost-button" onClick={onEdit}>Editar</button>
        <button type="button" className="danger-button" onClick={onDelete}>Remover</button>
      </div>
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Nao informada";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}
