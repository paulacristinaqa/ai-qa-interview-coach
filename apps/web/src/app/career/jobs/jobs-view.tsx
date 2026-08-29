import * as React from "react";
import Link from "next/link";
import type { CompetencyEvaluation, JobAnalysis, JobOpportunity, JobStatus, ProfessionalEvidence, WorkModel } from "../../../lib/types";
import { evidenceTypeLabels } from "../evidence/evidence-view";

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

export function JobOpportunityDetail({ job, onEdit, onDelete, onAnalyze, isAnalyzing, evidence = [], selectedEvidenceIds = [], onToggleEvidence, onEvaluateCompetencies, isEvaluating }: {
  job: JobOpportunity;
  onEdit?: () => void;
  onDelete?: () => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  evidence?: ProfessionalEvidence[];
  selectedEvidenceIds?: string[];
  onToggleEvidence?: (id: string) => void;
  onEvaluateCompetencies?: () => void;
  isEvaluating?: boolean;
}) {
  return (
    <section className="panel job-detail" aria-label="Detalhe da oportunidade">
      <div className="panel-header">
        <div><span className="helper-text">{job.company}</span><h2>{job.title}{job.favorite ? " (favorita)" : ""}</h2></div>
        <div className="actions">
          <Link className="button-link" href={`/grill-me?opportunityId=${encodeURIComponent(job.id)}`}>Treinar para esta vaga</Link>
          <Link className="button-link secondary" href={`/career/documents?opportunityId=${encodeURIComponent(job.id)}`}>Criar documentos</Link>
          <button type="button" onClick={onAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Analisando..." : job.analysis ? "Analisar novamente" : "Analisar vaga"}
          </button>
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
      {job.analysis ? (
        <><JobAnalysisPanel analysis={job.analysis} /><CompetencyEvaluator job={job} evidence={evidence} selectedEvidenceIds={selectedEvidenceIds} onToggleEvidence={onToggleEvidence} onEvaluate={onEvaluateCompetencies} isEvaluating={isEvaluating} /></>
      ) : (
        <p className="helper-text">Gere uma analise estruturada para comparar esta vaga com as evidencias do seu perfil.</p>
      )}
    </section>
  );
}

export function CompetencyEvaluator({ job, evidence, selectedEvidenceIds, onToggleEvidence, onEvaluate, isEvaluating }: {
  job: JobOpportunity;
  evidence: ProfessionalEvidence[];
  selectedEvidenceIds: string[];
  onToggleEvidence?: (id: string) => void;
  onEvaluate?: () => void;
  isEvaluating?: boolean;
}) {
  const evaluation = job.competencyEvaluation;
  const stale = Boolean(evaluation && job.analysis && evaluation.analysisUpdatedAt !== job.analysis.updatedAt);
  return (
    <section className="competency-evaluator" aria-label="Avaliador de competencias">
      <div className="analysis-heading"><div><span className="helper-text">Evidence Library</span><h2>Avaliador de competências</h2></div>{evaluation ? <strong>{Math.round(evaluation.overallScore)}%</strong> : null}</div>
      <p>Selecione somente evidências que você consegue defender. Matches positivos sempre citam os IDs usados.</p>
      <fieldset className="opportunity-picker evidence-picker"><legend>Evidências para esta avaliação</legend>{evidence.map((item) => <label className="checkbox-label" key={item.id}><input type="checkbox" checked={selectedEvidenceIds.includes(item.id)} onChange={() => onToggleEvidence?.(item.id)} /><span><strong>{item.title}</strong><small>{evidenceTypeLabels[item.type]} · {item.skills.join(", ") || "sem competências marcadas"}</small></span></label>)}{evidence.length === 0 ? <p className="helper-text">Cadastre evidências na Evidence Library antes de avaliar.</p> : null}</fieldset>
      <button type="button" onClick={onEvaluate} disabled={isEvaluating || selectedEvidenceIds.length === 0}>{isEvaluating ? "Avaliando..." : evaluation ? "Avaliar novamente" : "Avaliar competências"}</button>
      {stale ? <p className="status-warning"><strong>Avaliação desatualizada:</strong> a análise da vaga mudou. Avalie novamente antes de usar esta matriz.</p> : null}
      {evaluation ? <CompetencyEvaluationPanel evaluation={evaluation} /> : null}
    </section>
  );
}

export function CompetencyEvaluationPanel({ evaluation }: { evaluation: CompetencyEvaluation }) {
  return (
    <section className="competency-result" aria-label="Matriz de competencias">
      <h3>Matriz de aderência: {Math.round(evaluation.overallScore)}%</h3>
      <p><strong>{evaluation.summary}</strong></p>
      <div className="fit-matrix">{evaluation.requirements.map((item) => <article className={`fit-row ${item.status}`} key={item.id}><div><strong>{item.text}</strong><span className={`status-pill ${item.status}`}>{item.status === "supported" ? "Comprovado" : item.status === "partial" ? "Parcial" : "Lacuna"}</span></div><p>{item.rationale}</p><small>{item.importance === "required" ? "Obrigatório" : "Desejável"} · confiança {Math.round(item.confidence * 100)}% · evidências: {item.evidenceIds.join(", ") || "nenhuma"}</small><p className="helper-text">Orientação: {item.documentGuidance}</p></article>)}</div>
      <p className="helper-text">Provider: {evaluation.providerName} / Template: {evaluation.promptTemplateVersion}</p>
    </section>
  );
}

export function JobAnalysisPanel({ analysis }: { analysis: JobAnalysis }) {
  return (
    <section className="job-analysis" aria-label="Analise estruturada da vaga">
      <div className="analysis-heading">
        <div><span className="helper-text">Analise estruturada</span><h2>Aderencia {Math.round(analysis.profileFit.score)}%</h2></div>
        <span className="status-pill">Senioridade estimada: {analysis.estimatedSeniority}</span>
      </div>
      <p>{analysis.technicalSummary}</p>
      <p><strong>{analysis.profileFit.summary}</strong></p>
      <div className="analysis-grid">
        <AnalysisList title="Responsabilidades" items={analysis.responsibilities} />
        <AnalysisList title="Requisitos obrigatorios" items={analysis.requiredRequirements} />
        <AnalysisList title="Requisitos desejaveis" items={analysis.preferredRequirements} />
        <AnalysisList title="Tecnologias" items={analysis.technologies} />
        <AnalysisList title="Soft skills" items={analysis.softSkills} />
        <AnalysisList title="Lacunas" items={analysis.gaps} />
      </div>
      <div>
        <h3>Plano de preparacao</h3>
        <div className="preparation-list">
          {analysis.preparationPlan.map((item, index) => (
            <div className={`priority-card ${item.priority}`} key={`${item.action}-${index}`}>
              <span>{item.priority}</span><strong>{item.action}</strong><small>{item.rationale}</small>
            </div>
          ))}
        </div>
      </div>
      <p className="helper-text">Provider: {analysis.providerName} / Template: {analysis.promptTemplateVersion}</p>
    </section>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="analysis-list">
      <h3>{title}</h3>
      {items.length ? <ul>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="helper-text">Nenhum item identificado.</p>}
    </div>
  );
}
