"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../../components/auth-provider";
import { PageHeader, StatusMessage } from "../../../components/page";
import type { JobAnalysis, JobOpportunity, JobStatus, WorkModel } from "../../../lib/types";
import {
  buildJobQuery,
  JobFilters,
  JobOpportunityCard,
  JobOpportunityDetail,
  statusLabels,
  workModelLabels
} from "./jobs-view";

interface JobForm {
  title: string;
  company: string;
  country: string;
  city: string;
  workModel: WorkModel;
  seniority: string;
  language: string;
  link: string;
  originalDescription: string;
  status: JobStatus;
  favorite: boolean;
  notes: string;
}

const emptyForm: JobForm = {
  title: "",
  company: "",
  country: "Portugal",
  city: "",
  workModel: "remote",
  seniority: "Mid",
  language: "English",
  link: "",
  originalDescription: "",
  status: "saved",
  favorite: false,
  notes: ""
};
const emptyFilters: JobFilters = { search: "", status: "", workModel: "", seniority: "", favorite: "" };

export default function JobsPage() {
  const { api } = useAuth();
  const [items, setItems] = useState<JobOpportunity[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<JobOpportunity | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const selected = detail?.id === selectedId ? detail : items.find((item) => item.id === selectedId) ?? null;

  const load = useCallback(async () => {
    try {
      const query = buildJobQuery(filters);
      const data = await api<JobOpportunity[]>(query ? `/job-opportunities?${query}` : "/job-opportunities");
      setItems(data);
      setSelectedId((current) => current && data.some((item) => item.id === current) ? current : data[0]?.id ?? null);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as oportunidades.");
    }
  }, [api, filters]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let ignore = false;
    api<JobOpportunity>(`/job-opportunities/${selectedId}`)
      .then((opportunity) => { if (!ignore) setDetail(opportunity); })
      .catch((error) => { if (!ignore) setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o detalhe."); });
    return () => { ignore = true; };
  }, [api, selectedId]);

  function updateForm<K extends keyof JobForm>(field: K, value: JobForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wasEditing = Boolean(editingId);
    setIsSaving(true);
    try {
      const saved = await api<JobOpportunity>(editingId ? `/job-opportunities/${editingId}` : "/job-opportunities", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form)
      });
      setEditingId(null);
      setForm(emptyForm);
      await load();
      setSelectedId(saved.id);
      setDetail(saved);
      setMessage(wasEditing ? "Oportunidade atualizada." : "Oportunidade criada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a oportunidade.");
    } finally {
      setIsSaving(false);
    }
  }

  function edit(job: JobOpportunity) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      company: job.company,
      country: job.country,
      city: job.city ?? "",
      workModel: job.workModel,
      seniority: job.seniority,
      language: job.language,
      link: job.link ?? "",
      originalDescription: job.originalDescription,
      status: job.status,
      favorite: job.favorite,
      notes: job.notes ?? ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function remove(job: JobOpportunity) {
    if (!window.confirm(`Excluir ${job.title} em ${job.company}?`)) return;
    try {
      await api<void>(`/job-opportunities/${job.id}`, { method: "DELETE" });
      setSelectedId(null);
      setDetail(null);
      await load();
      setMessage("Oportunidade excluida.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir a oportunidade.");
    }
  }

  async function analyze(job: JobOpportunity) {
    setIsAnalyzing(true);
    try {
      const analysis = await api<JobAnalysis>(`/jobs/${job.id}/analyze`, { method: "POST" });
      setDetail({ ...job, analysis });
      setItems((current) => current.map((item) => item.id === job.id ? { ...item, analysis } : item));
      setMessage(`Analise atualizada com o provider ${analysis.providerName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel analisar a vaga.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Career Intelligence"
        title="Jobs"
        description="Registre e acompanhe oportunidades manualmente, sem scraping ou integracoes externas."
        action={<button type="button" onClick={() => void load()}>Atualizar</button>}
      />
      <StatusMessage message={message} />
      <div className="jobs-layout">
        <section className="panel job-form-panel">
          <div className="panel-header">
            <div><span className="helper-text">Cadastro manual</span><h2>{editingId ? "Editar oportunidade" : "Nova oportunidade"}</h2></div>
            {editingId ? <button type="button" className="ghost-button" onClick={cancelEdit}>Cancelar</button> : null}
          </div>
          <form className="answer-form" onSubmit={submit}>
            <div className="two-column">
              <label>Titulo<input required value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
              <label>Empresa<input required value={form.company} onChange={(event) => updateForm("company", event.target.value)} /></label>
            </div>
            <div className="two-column">
              <label>Pais<input required value={form.country} onChange={(event) => updateForm("country", event.target.value)} /></label>
              <label>Cidade<input value={form.city} onChange={(event) => updateForm("city", event.target.value)} /></label>
            </div>
            <div className="config-grid">
              <label>Modelo<select value={form.workModel} onChange={(event) => updateForm("workModel", event.target.value as WorkModel)}>{Object.entries(workModelLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>Senioridade<input required value={form.seniority} onChange={(event) => updateForm("seniority", event.target.value)} /></label>
              <label>Idioma<input required value={form.language} onChange={(event) => updateForm("language", event.target.value)} /></label>
            </div>
            <label>Link do anuncio<input type="url" placeholder="https://..." value={form.link} onChange={(event) => updateForm("link", event.target.value)} /></label>
            <label>Descricao original<textarea required rows={8} value={form.originalDescription} onChange={(event) => updateForm("originalDescription", event.target.value)} /></label>
            <div className="two-column">
              <label>Status<select value={form.status} onChange={(event) => updateForm("status", event.target.value as JobStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              <label>Observacoes<textarea rows={3} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} /></label>
            </div>
            <label className="checkbox-label"><input type="checkbox" checked={form.favorite} onChange={(event) => updateForm("favorite", event.target.checked)} />Marcar como favorita</label>
            <button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Criar oportunidade"}</button>
          </form>
        </section>

        <section className="panel job-list-panel">
          <div className="panel-header"><div><span className="helper-text">Pipeline manual</span><h2>Oportunidades</h2></div><strong>{items.length}</strong></div>
          <div className="job-filters">
            <label>Busca<input placeholder="Cargo, empresa ou local" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
            <label>Status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Modelo<select value={filters.workModel} onChange={(event) => setFilters({ ...filters, workModel: event.target.value })}><option value="">Todos</option>{Object.entries(workModelLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Senioridade<input value={filters.seniority} onChange={(event) => setFilters({ ...filters, seniority: event.target.value })} /></label>
            <label>Favoritas<select value={filters.favorite} onChange={(event) => setFilters({ ...filters, favorite: event.target.value })}><option value="">Todas</option><option value="true">Somente favoritas</option><option value="false">Nao favoritas</option></select></label>
          </div>
          <div className="job-list">
            {items.map((job) => <JobOpportunityCard job={job} selected={job.id === selectedId} onSelect={() => setSelectedId(job.id)} key={job.id} />)}
            {items.length === 0 ? <div className="inline-empty"><p>Nenhuma oportunidade encontrada.</p></div> : null}
          </div>
        </section>
      </div>
      {selected ? (
        <JobOpportunityDetail
          job={selected}
          onEdit={() => edit(selected)}
          onDelete={() => void remove(selected)}
          onAnalyze={() => void analyze(selected)}
          isAnalyzing={isAnalyzing}
        />
      ) : null}
    </>
  );
}
