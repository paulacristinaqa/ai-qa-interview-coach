"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../components/auth-provider";
import { PageHeader, StatusMessage } from "../../../components/page";
import type { CareerDocument, CareerDocumentLanguage, JobOpportunity } from "../../../lib/types";
import { buildDocumentExport, CareerDocumentCard, CareerDocumentDetail, languageLabels } from "./documents-view";

export default function DocumentsPage() {
  return <Suspense fallback={<p>Carregando documentos...</p>}><DocumentsContent /></Suspense>;
}

function DocumentsContent() {
  const { api } = useAuth();
  const searchParams = useSearchParams();
  const requestedOpportunityId = searchParams.get("opportunityId") ?? "";
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [documents, setDocuments] = useState<CareerDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opportunityId, setOpportunityId] = useState(requestedOpportunityId);
  const [language, setLanguage] = useState<CareerDocumentLanguage>("pt-BR");
  const [candidateProfile, setCandidateProfile] = useState("");
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [jobData, documentData] = await Promise.all([
        api<JobOpportunity[]>("/job-opportunities"),
        api<CareerDocument[]>("/career-documents")
      ]);
      setOpportunities(jobData);
      setDocuments(documentData);
      setSelectedId((current) => current && documentData.some((item) => item.id === current) ? current : documentData[0]?.id ?? null);
      setOpportunityId((current) => current || requestedOpportunityId || jobData[0]?.id || "");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os documentos.");
    }
  }, [api, requestedOpportunityId]);

  useEffect(() => { void load(); }, [load]);

  const selected = documents.find((document) => document.id === selectedId) ?? null;

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    try {
      const generated = await api<CareerDocument>("/career-documents/generate", {
        method: "POST",
        body: JSON.stringify({ opportunityId, language, candidateProfile })
      });
      await load();
      setSelectedId(generated.id);
      setMessage("Pacote gerado. Revise cuidadosamente o CV e a carta antes de usar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível gerar os documentos.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function remove(document: CareerDocument) {
    if (!window.confirm(`Excluir os documentos de ${document.opportunity.title} em ${languageLabels[document.language]}?`)) return;
    try {
      await api<void>(`/career-documents/${document.id}`, { method: "DELETE" });
      await load();
      setMessage("Pacote de documentos excluído.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir os documentos.");
    }
  }

  function download(document: CareerDocument) {
    const blob = new Blob([buildDocumentExport(document)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${safeFileName(document.opportunity.company)}-${safeFileName(document.opportunity.title)}-${document.language}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        eyebrow="Career Intelligence"
        title="Documents"
        description="Crie um CV, uma carta de apresentação e uma matriz de aderência específicos para cada vaga."
        action={<button type="button" onClick={() => void load()}>Atualizar</button>}
      />
      <StatusMessage message={message} />
      <section className="panel document-form-panel">
        <div className="panel-header"><div><span className="helper-text">Português ou Inglês</span><h2>Novo pacote direcionado</h2></div></div>
        <form className="answer-form" onSubmit={generate}>
          <div className="two-column">
            <label>Vaga
              <select required value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}>
                <option value="">Selecione uma oportunidade</option>
                {opportunities.map((job) => <option value={job.id} key={job.id}>{job.title} - {job.company}</option>)}
              </select>
            </label>
            <label>Idioma
              <select value={language} onChange={(event) => setLanguage(event.target.value as CareerDocumentLanguage)}>
                {Object.entries(languageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label>Evidências profissionais
            <textarea
              required
              minLength={40}
              maxLength={20000}
              rows={10}
              placeholder="Cole apenas experiências, competências, projetos e resultados verdadeiros que podem constar no CV."
              value={candidateProfile}
              onChange={(event) => setCandidateProfile(event.target.value)}
            />
          </label>
          <p className="helper-text">Não inclua senhas, documentos pessoais ou dados sensíveis. O sistema não inventa competências ausentes: elas aparecem como lacunas.</p>
          <button type="submit" disabled={isGenerating || !opportunityId || candidateProfile.trim().length < 40}>{isGenerating ? "Gerando..." : "Gerar documentos"}</button>
        </form>
      </section>

      <div className="jobs-layout documents-layout">
        <section className="panel job-list-panel">
          <div className="panel-header"><div><span className="helper-text">Histórico por vaga e idioma</span><h2>Pacotes salvos</h2></div><strong>{documents.length}</strong></div>
          <div className="job-list">
            {documents.map((document) => <CareerDocumentCard document={document} selected={document.id === selectedId} onSelect={() => setSelectedId(document.id)} key={document.id} />)}
            {documents.length === 0 ? <div className="inline-empty"><p>Nenhum pacote gerado.</p></div> : null}
          </div>
        </section>
        <div>{selected ? <CareerDocumentDetail document={selected} onDownload={() => download(selected)} onDelete={() => void remove(selected)} /> : null}</div>
      </div>
    </>
  );
}

function safeFileName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
