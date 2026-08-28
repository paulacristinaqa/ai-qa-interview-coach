import * as React from "react";
import type { CareerDocument, CareerDocumentLanguage, FitStatus } from "../../../lib/types";

export const languageLabels: Record<CareerDocumentLanguage, string> = {
  "pt-BR": "Português",
  en: "Inglês"
};

export const fitStatusLabels: Record<FitStatus, string> = {
  supported: "Comprovado",
  partial: "Parcial",
  gap: "Lacuna"
};

export function CareerDocumentCard({ document, selected, onSelect }: {
  document: CareerDocument;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button type="button" className={`job-card ${selected ? "selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
      <span className="job-card-heading"><strong>{document.opportunity.title}</strong><span>{languageLabels[document.language]}</span></span>
      <span>{document.opportunity.company}</span>
      <small>Atualizado em {formatDate(document.updatedAt)}</small>
    </button>
  );
}

export function CareerDocumentDetail({ document, onDownload, onDelete }: {
  document: CareerDocument;
  onDownload?: () => void;
  onDelete?: () => void;
}) {
  return (
    <section className="panel career-document-detail" aria-label="Pacote de candidatura">
      <div className="panel-header">
        <div>
          <span className="helper-text">{document.opportunity.company} · {languageLabels[document.language]}</span>
          <h2>{document.opportunity.title}</h2>
        </div>
        <div className="actions">
          <button type="button" onClick={onDownload}>Baixar Markdown</button>
          <button type="button" className="danger-button" onClick={onDelete}>Excluir</button>
        </div>
      </div>
      <p className="helper-text">Rascunho gerado a partir das evidências fornecidas. Revise todo o conteúdo antes de enviar.</p>
      <div className="document-grid">
        <article><h3>CV direcionado</h3><pre>{document.cvMarkdown}</pre></article>
        <article><h3>Carta de apresentação</h3><pre>{document.coverLetter}</pre></article>
      </div>
      <section>
        <h3>Matriz de aderência</h3>
        <div className="fit-matrix">
          {document.fitMatrix.map((item, index) => (
            <article className={`fit-row ${item.status}`} key={`${item.requirement}-${index}`}>
              <div><strong>{item.requirement}</strong><span className={`status-pill ${item.status}`}>{fitStatusLabels[item.status]}</span></div>
              <p>{item.evidence}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="helper-text">Provider: {document.providerName} / Template: {document.promptTemplateVersion}</p>
    </section>
  );
}

export function buildDocumentExport(document: CareerDocument) {
  const matrix = document.fitMatrix.map((item) => `- **${item.requirement}** — ${fitStatusLabels[item.status]}: ${item.evidence}`).join("\n");
  return `# ${document.opportunity.title} — ${document.opportunity.company}\n\n## CV direcionado\n\n${document.cvMarkdown}\n\n## Carta de apresentação\n\n${document.coverLetter}\n\n## Matriz de aderência\n\n${matrix}\n`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}
