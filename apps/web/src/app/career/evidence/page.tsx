"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../../components/auth-provider";
import { PageHeader, StatusMessage } from "../../../components/page";
import type { EvidenceType, ProfessionalEvidence } from "../../../lib/types";
import { buildEvidenceQuery, EvidenceCard, evidenceTypeLabels } from "./evidence-view";

interface EvidenceForm {
  type: EvidenceType;
  title: string;
  description: string;
  skills: string;
  outcome: string;
  sourceUrl: string;
  occurredAt: string;
  favorite: boolean;
}

const emptyForm: EvidenceForm = { type: "experience", title: "", description: "", skills: "", outcome: "", sourceUrl: "", occurredAt: "", favorite: false };

export default function EvidencePage() {
  const { api } = useAuth();
  const [evidence, setEvidence] = useState<ProfessionalEvidence[]>([]);
  const [form, setForm] = useState<EvidenceForm>(emptyForm);
  const [filters, setFilters] = useState({ search: "", type: "", favorite: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const query = buildEvidenceQuery(filters);
      setEvidence(await api<ProfessionalEvidence[]>(query ? `/professional-evidence?${query}` : "/professional-evidence"));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar as evidências.");
    }
  }, [api, filters]);

  useEffect(() => { void load(); }, [load]);

  function update<K extends keyof EvidenceForm>(field: K, value: EvidenceForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const wasEditing = Boolean(editingId);
    try {
      await api(editingId ? `/professional-evidence/${editingId}` : "/professional-evidence", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean) })
      });
      setEditingId(null);
      setForm(emptyForm);
      await load();
      setMessage(wasEditing ? "Evidência atualizada." : "Evidência adicionada à biblioteca.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a evidência.");
    } finally {
      setIsSaving(false);
    }
  }

  function edit(item: ProfessionalEvidence) {
    setEditingId(item.id);
    setForm({ type: item.type, title: item.title, description: item.description, skills: item.skills.join(", "), outcome: item.outcome ?? "", sourceUrl: item.sourceUrl ?? "", occurredAt: item.occurredAt?.slice(0, 10) ?? "", favorite: item.favorite });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function remove(item: ProfessionalEvidence) {
    if (!window.confirm(`Excluir a evidência ${item.title}? Documentos já gerados manterão seu snapshot histórico.`)) return;
    try {
      await api<void>(`/professional-evidence/${item.id}`, { method: "DELETE" });
      if (editingId === item.id) cancelEdit();
      await load();
      setMessage("Evidência excluída; documentos existentes foram preservados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir a evidência.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Career Intelligence" title="Evidence Library" description="Registre fatos profissionais reutilizáveis para avaliações, CVs e cartas direcionadas." action={<button type="button" onClick={() => void load()}>Atualizar</button>} />
      <StatusMessage message={message} />
      <section className="panel evidence-form-panel">
        <div className="panel-header"><div><span className="helper-text">Somente fatos verificáveis</span><h2>{editingId ? "Editar evidência" : "Nova evidência"}</h2></div>{editingId ? <button type="button" className="ghost-button" onClick={cancelEdit}>Cancelar</button> : null}</div>
        <form className="answer-form" onSubmit={submit}>
          <div className="two-column"><label>Tipo<select value={form.type} onChange={(event) => update("type", event.target.value as EvidenceType)}>{Object.entries(evidenceTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Título<input required maxLength={200} value={form.title} onChange={(event) => update("title", event.target.value)} /></label></div>
          <label>Descrição factual<textarea required minLength={20} maxLength={5000} rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
          <label>Competências e tecnologias<input placeholder="Playwright, API Testing, SQL" value={form.skills} onChange={(event) => update("skills", event.target.value)} /></label>
          <label>Resultado comprovável<textarea maxLength={3000} rows={3} value={form.outcome} onChange={(event) => update("outcome", event.target.value)} /></label>
          <div className="two-column"><label>Fonte opcional<input type="url" placeholder="https://" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} /></label><label>Data da evidência<input type="date" value={form.occurredAt} onChange={(event) => update("occurredAt", event.target.value)} /></label></div>
          <label className="checkbox-label"><input type="checkbox" checked={form.favorite} onChange={(event) => update("favorite", event.target.checked)} />Destacar como favorita</label>
          <p className="helper-text">Não inclua senhas, documentos pessoais, dados confidenciais de empresas ou informações que não possam ser defendidas em entrevista.</p>
          <button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar evidência"}</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-header"><div><span className="helper-text">Catálogo pessoal</span><h2>Evidências salvas</h2></div><strong>{evidence.length}</strong></div>
        <div className="job-filters"><label>Busca<input placeholder="Título, descrição ou resultado" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label><label>Tipo<select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Todos</option>{Object.entries(evidenceTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Favoritas<select value={filters.favorite} onChange={(event) => setFilters({ ...filters, favorite: event.target.value })}><option value="">Todas</option><option value="true">Somente favoritas</option><option value="false">Não favoritas</option></select></label></div>
        <div className="evidence-list">{evidence.map((item) => <EvidenceCard evidence={item} onEdit={() => edit(item)} onDelete={() => void remove(item)} key={item.id} />)}{evidence.length === 0 ? <div className="inline-empty"><p>Nenhuma evidência encontrada.</p></div> : null}</div>
      </section>
    </>
  );
}
