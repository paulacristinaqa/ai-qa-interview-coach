"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../../components/auth-provider";
import { PageHeader, StatusMessage } from "../../../components/page";
import type { ApplicationStatus, JobApplication, JobOpportunity } from "../../../lib/types";
import { ApplicationCard, ApplicationSummary, applicationStatusLabels, buildApplicationQuery } from "./applications-view";

interface ApplicationForm {
  opportunityId: string;
  status: ApplicationStatus;
  appliedAt: string;
  nextAction: string;
  nextActionAt: string;
  notes: string;
}

const emptyForm: ApplicationForm = {
  opportunityId: "",
  status: "planned",
  appliedAt: "",
  nextAction: "",
  nextActionAt: "",
  notes: ""
};

export default function ApplicationsPage() {
  const { api } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const query = buildApplicationQuery(filters);
      const [applicationData, opportunityData] = await Promise.all([
        api<JobApplication[]>(query ? `/job-applications?${query}` : "/job-applications"),
        api<JobOpportunity[]>("/job-opportunities")
      ]);
      setApplications(applicationData);
      setOpportunities(opportunityData);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as candidaturas.");
    }
  }, [api, filters]);

  useEffect(() => { void load(); }, [load]);

  const availableOpportunities = useMemo(() => {
    const editing = applications.find((application) => application.id === editingId)?.opportunityId;
    return opportunities.filter((opportunity) => !opportunity.application || opportunity.id === editing);
  }, [applications, opportunities, editingId]);

  function updateForm<K extends keyof ApplicationForm>(field: K, value: ApplicationForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const wasEditing = Boolean(editingId);
    try {
      const body = editingId ? {
        status: form.status,
        appliedAt: form.appliedAt,
        nextAction: form.nextAction,
        nextActionAt: form.nextActionAt,
        notes: form.notes
      } : form;
      await api(editingId ? `/job-applications/${editingId}` : "/job-applications", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(body)
      });
      setEditingId(null);
      setForm(emptyForm);
      await load();
      setMessage(wasEditing ? "Candidatura atualizada." : "Candidatura adicionada ao pipeline.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a candidatura.");
    } finally {
      setIsSaving(false);
    }
  }

  function edit(application: JobApplication) {
    setEditingId(application.id);
    setForm({
      opportunityId: application.opportunityId,
      status: application.status,
      appliedAt: toDateInput(application.appliedAt),
      nextAction: application.nextAction ?? "",
      nextActionAt: toDateInput(application.nextActionAt),
      notes: application.notes ?? ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function remove(application: JobApplication) {
    if (!window.confirm(`Remover o acompanhamento de ${application.opportunity.title}?`)) return;
    try {
      await api<void>(`/job-applications/${application.id}`, { method: "DELETE" });
      if (editingId === application.id) cancelEdit();
      await load();
      setMessage("Candidatura removida do pipeline; a vaga foi preservada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel remover a candidatura.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Career Intelligence"
        title="Applications"
        description="Acompanhe manualmente cada candidatura, seus prazos e a proxima acao."
        action={<button type="button" onClick={() => void load()}>Atualizar</button>}
      />
      <StatusMessage message={message} />
      <ApplicationSummary applications={applications} />
      <div className="jobs-layout applications-layout">
        <section className="panel job-form-panel">
          <div className="panel-header">
            <div><span className="helper-text">Pipeline manual</span><h2>{editingId ? "Editar candidatura" : "Nova candidatura"}</h2></div>
            {editingId ? <button type="button" className="ghost-button" onClick={cancelEdit}>Cancelar</button> : null}
          </div>
          <form className="answer-form" onSubmit={submit}>
            <label>Vaga
              <select required disabled={Boolean(editingId)} value={form.opportunityId} onChange={(event) => updateForm("opportunityId", event.target.value)}>
                <option value="">Selecione uma oportunidade</option>
                {availableOpportunities.map((job) => <option value={job.id} key={job.id}>{job.title} - {job.company}</option>)}
              </select>
            </label>
            {!editingId && availableOpportunities.length === 0 ? <p className="helper-text">Cadastre uma nova vaga em Jobs ou remova um acompanhamento existente.</p> : null}
            <label>Etapa
              <select value={form.status} onChange={(event) => updateForm("status", event.target.value as ApplicationStatus)}>
                {Object.entries(applicationStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <div className="two-column">
              <label>Data da candidatura<input type="date" value={form.appliedAt} onChange={(event) => updateForm("appliedAt", event.target.value)} /></label>
              <label>Prazo da proxima acao<input type="date" value={form.nextActionAt} onChange={(event) => updateForm("nextActionAt", event.target.value)} /></label>
            </div>
            <label>Proxima acao<input placeholder="Ex.: preparar exemplos para entrevista" value={form.nextAction} onChange={(event) => updateForm("nextAction", event.target.value)} /></label>
            <label>Observacoes<textarea rows={5} value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} /></label>
            <button type="submit" disabled={isSaving || (!editingId && !form.opportunityId)}>{isSaving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Adicionar candidatura"}</button>
          </form>
        </section>

        <section className="panel job-list-panel">
          <div className="panel-header"><div><span className="helper-text">Acompanhamento</span><h2>Candidaturas</h2></div><strong>{applications.length}</strong></div>
          <div className="job-filters">
            <label>Busca<input placeholder="Cargo ou empresa" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label>
            <label>Etapa<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todas</option>{Object.entries(applicationStatusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          </div>
          <div className="job-list">
            {applications.map((application) => <ApplicationCard application={application} onEdit={() => edit(application)} onDelete={() => void remove(application)} key={application.id} />)}
            {applications.length === 0 ? <div className="inline-empty"><p>Nenhuma candidatura encontrada.</p></div> : null}
          </div>
        </section>
      </div>
    </>
  );
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}
