import * as React from "react";
import type { JobOpportunity, JobStatus, WorkModel } from "../../../lib/types";

export const statusLabels: Record<JobStatus, string> = {
  saved: "Guardada",
  applied: "Candidatura enviada",
  interviewing: "Em entrevistas",
  offer: "Proposta",
  rejected: "Encerrada",
  archived: "Arquivada"
};

export const workModelLabels: Record<WorkModel, string> = {
  remote: "Remoto",
  hybrid: "Hibrido",
  onsite: "Presencial"
};

export interface JobFilters {
  search: string;
  status: string;
  workModel: string;
  seniority: string;
  favorite: string;
}

export function buildJobQuery(filters: JobFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return params.toString();
}

export function JobOpportunityCard({ job, selected, onSelect }: {
  job: JobOpportunity;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button type="button" className={`job-card ${selected ? "selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
      <span className="job-card-heading"><strong>{job.title}</strong>{job.favorite ? <span title="Favorita">Favorita</span> : null}</span>
      <span>{job.company}</span>
      <small>{[job.city, job.country].filter(Boolean).join(", ")} / {workModelLabels[job.workModel]} / {job.seniority}</small>
      <span className={`status-pill ${job.status}`}>{statusLabels[job.status]}</span>
    </button>
  );
}

export function JobOpportunityDetail({ job, onEdit, onDelete }: {
  job: JobOpportunity;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <section className="panel job-detail" aria-label="Detalhe da oportunidade">
      <div className="panel-header">
        <div><span className="helper-text">{job.company}</span><h2>{job.title}{job.favorite ? " (favorita)" : ""}</h2></div>
        <div className="actions">
          <button type="button" className="ghost-button" onClick={onEdit}>Editar</button>
          <button type="button" className="danger-button" onClick={onDelete}>Excluir</button>
        </div>
      </div>
      <div className="job-meta">
        <span>{[job.city, job.country].filter(Boolean).join(", ")}</span><span>{workModelLabels[job.workModel]}</span>
        <span>{job.seniority}</span><span>{job.language}</span><span>{statusLabels[job.status]}</span>
      </div>
      {job.link ? <p><a className="text-link" href={job.link} target="_blank" rel="noreferrer">Abrir anuncio original</a></p> : null}
      <div><h3>Descricao original</h3><p className="preserved-text">{job.originalDescription}</p></div>
      {job.notes ? <div><h3>Observacoes</h3><p className="preserved-text">{job.notes}</p></div> : null}
    </section>
  );
}
