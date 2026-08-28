import * as React from "react";
import type { EvidenceType, ProfessionalEvidence } from "../../../lib/types";

export const evidenceTypeLabels: Record<EvidenceType, string> = {
  experience: "Experiência",
  project: "Projeto",
  achievement: "Resultado",
  skill: "Competência",
  certification: "Certificação",
  education: "Formação",
  language: "Idioma"
};

export function buildEvidenceQuery(filters: { search: string; type: string; favorite: string }) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.favorite) params.set("favorite", filters.favorite);
  return params.toString();
}

export function EvidenceCard({ evidence, onEdit, onDelete }: { evidence: ProfessionalEvidence; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <article className="evidence-card">
      <div className="panel-header">
        <div><span className="helper-text">{evidenceTypeLabels[evidence.type]}</span><h3>{evidence.title}{evidence.favorite ? " (favorita)" : ""}</h3></div>
        {evidence.occurredAt ? <time dateTime={evidence.occurredAt}>{formatDate(evidence.occurredAt)}</time> : null}
      </div>
      <p className="preserved-text">{evidence.description}</p>
      {evidence.outcome ? <p><strong>Resultado:</strong> {evidence.outcome}</p> : null}
      {evidence.skills.length ? <div className="evidence-skills">{evidence.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : null}
      {evidence.sourceUrl ? <a className="text-link" href={evidence.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte informada</a> : null}
      <div className="actions"><button type="button" className="ghost-button" onClick={onEdit}>Editar</button><button type="button" className="danger-button" onClick={onDelete}>Excluir</button></div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}
