"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../../components/auth-provider";
import { PageHeader, StatusMessage } from "../../../components/page";
import type { Company, CompanyContact, JobOpportunity } from "../../../lib/types";
import { buildCompanyQuery, CompanyCard, CompanyDetail } from "./companies-view";

interface CompanyForm {
  name: string;
  website: string;
  linkedinUrl: string;
  country: string;
  city: string;
  industry: string;
  size: string;
  workCulture: string;
  notes: string;
  favorite: boolean;
  opportunityIds: string[];
}

interface ContactForm {
  name: string;
  role: string;
  email: string;
  linkedinUrl: string;
  lastContactAt: string;
  notes: string;
}

const emptyCompanyForm: CompanyForm = { name: "", website: "", linkedinUrl: "", country: "", city: "", industry: "", size: "", workCulture: "", notes: "", favorite: false, opportunityIds: [] };
const emptyContactForm: ContactForm = { name: "", role: "", email: "", linkedinUrl: "", lastContactAt: "", notes: "" };

export default function CompaniesPage() {
  const { api } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyForm>(emptyCompanyForm);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);
  const [filters, setFilters] = useState({ search: "", favorite: "" });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const query = buildCompanyQuery(filters);
      const [companyData, opportunityData] = await Promise.all([
        api<Company[]>(query ? `/companies?${query}` : "/companies"),
        api<JobOpportunity[]>("/job-opportunities")
      ]);
      setCompanies(companyData);
      setOpportunities(opportunityData);
      setSelectedId((current) => current && companyData.some((item) => item.id === current) ? current : companyData[0]?.id ?? null);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar as empresas.");
    }
  }, [api, filters]);

  useEffect(() => { void load(); }, [load]);

  const selected = companies.find((company) => company.id === selectedId) ?? null;

  function updateCompany<K extends keyof CompanyForm>(field: K, value: CompanyForm[K]) {
    setCompanyForm((current) => ({ ...current, [field]: value }));
  }

  function updateContact<K extends keyof ContactForm>(field: K, value: ContactForm[K]) {
    setContactForm((current) => ({ ...current, [field]: value }));
  }

  function toggleOpportunity(id: string) {
    setCompanyForm((current) => ({
      ...current,
      opportunityIds: current.opportunityIds.includes(id) ? current.opportunityIds.filter((item) => item !== id) : [...current.opportunityIds, id]
    }));
  }

  async function submitCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const wasEditing = Boolean(editingId);
    try {
      const saved = await api<Company>(editingId ? `/companies/${editingId}` : "/companies", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(companyForm)
      });
      setEditingId(null);
      setCompanyForm(emptyCompanyForm);
      await load();
      setSelectedId(saved.id);
      setMessage(wasEditing ? "Empresa atualizada." : "Empresa adicionada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a empresa.");
    } finally {
      setIsSaving(false);
    }
  }

  function editCompany(company: Company) {
    setEditingId(company.id);
    setCompanyForm({
      name: company.name,
      website: company.website ?? "",
      linkedinUrl: company.linkedinUrl ?? "",
      country: company.country ?? "",
      city: company.city ?? "",
      industry: company.industry ?? "",
      size: company.size ?? "",
      workCulture: company.workCulture ?? "",
      notes: company.notes ?? "",
      favorite: company.favorite,
      opportunityIds: company.opportunities.map((item) => item.id)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelCompanyEdit() {
    setEditingId(null);
    setCompanyForm(emptyCompanyForm);
  }

  async function removeCompany(company: Company) {
    if (!window.confirm(`Excluir ${company.name}? As vagas serão preservadas e apenas desassociadas.`)) return;
    try {
      await api<void>(`/companies/${company.id}`, { method: "DELETE" });
      if (editingId === company.id) cancelCompanyEdit();
      await load();
      setMessage("Empresa excluída; vagas e candidaturas foram preservadas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir a empresa.");
    }
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setIsSaving(true);
    try {
      await api(editingContactId ? `/companies/${selected.id}/contacts/${editingContactId}` : `/companies/${selected.id}/contacts`, {
        method: editingContactId ? "PATCH" : "POST",
        body: JSON.stringify(contactForm)
      });
      setEditingContactId(null);
      setContactForm(emptyContactForm);
      await load();
      setSelectedId(selected.id);
      setMessage(editingContactId ? "Contato atualizado." : "Contato adicionado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o contato.");
    } finally {
      setIsSaving(false);
    }
  }

  function editContact(contact: CompanyContact) {
    setEditingContactId(contact.id);
    setContactForm({ name: contact.name, role: contact.role ?? "", email: contact.email ?? "", linkedinUrl: contact.linkedinUrl ?? "", lastContactAt: toDateInput(contact.lastContactAt), notes: contact.notes ?? "" });
  }

  async function removeContact(contact: CompanyContact) {
    if (!selected || !window.confirm(`Remover o contato ${contact.name}?`)) return;
    try {
      await api<void>(`/companies/${selected.id}/contacts/${contact.id}`, { method: "DELETE" });
      if (editingContactId === contact.id) { setEditingContactId(null); setContactForm(emptyContactForm); }
      await load();
      setSelectedId(selected.id);
      setMessage("Contato removido.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível remover o contato.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Career Intelligence" title="Companies" description="Organize empresas-alvo, pesquisa, vagas associadas e contatos de recrutamento." action={<button type="button" onClick={() => void load()}>Atualizar</button>} />
      <StatusMessage message={message} />
      <section className="panel company-form-panel">
        <div className="panel-header"><div><span className="helper-text">Cadastro manual</span><h2>{editingId ? "Editar empresa" : "Nova empresa"}</h2></div>{editingId ? <button type="button" className="ghost-button" onClick={cancelCompanyEdit}>Cancelar</button> : null}</div>
        <form className="answer-form" onSubmit={submitCompany}>
          <div className="two-column"><label>Nome<input required maxLength={200} value={companyForm.name} onChange={(event) => updateCompany("name", event.target.value)} /></label><label>Setor<input maxLength={160} value={companyForm.industry} onChange={(event) => updateCompany("industry", event.target.value)} /></label></div>
          <div className="two-column"><label>País<input maxLength={120} value={companyForm.country} onChange={(event) => updateCompany("country", event.target.value)} /></label><label>Cidade<input maxLength={120} value={companyForm.city} onChange={(event) => updateCompany("city", event.target.value)} /></label></div>
          <div className="two-column"><label>Website<input type="url" placeholder="https://" value={companyForm.website} onChange={(event) => updateCompany("website", event.target.value)} /></label><label>LinkedIn<input type="url" placeholder="https://linkedin.com/company/..." value={companyForm.linkedinUrl} onChange={(event) => updateCompany("linkedinUrl", event.target.value)} /></label></div>
          <label>Porte<input maxLength={80} placeholder="Ex.: 51-200 pessoas" value={companyForm.size} onChange={(event) => updateCompany("size", event.target.value)} /></label>
          <label>Cultura e ambiente<textarea rows={4} maxLength={5000} value={companyForm.workCulture} onChange={(event) => updateCompany("workCulture", event.target.value)} /></label>
          <label>Pesquisa e observações<textarea rows={5} maxLength={10000} value={companyForm.notes} onChange={(event) => updateCompany("notes", event.target.value)} /></label>
          <fieldset className="opportunity-picker"><legend>Vagas associadas</legend>{opportunities.map((job) => <label className="checkbox-label" key={job.id}><input type="checkbox" checked={companyForm.opportunityIds.includes(job.id)} onChange={() => toggleOpportunity(job.id)} />{job.title} — {job.company}</label>)}{opportunities.length === 0 ? <p className="helper-text">Cadastre vagas em Jobs para associá-las.</p> : null}</fieldset>
          <label className="checkbox-label"><input type="checkbox" checked={companyForm.favorite} onChange={(event) => updateCompany("favorite", event.target.checked)} />Empresa favorita</label>
          <button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar empresa"}</button>
        </form>
      </section>

      <section className="panel company-list-panel">
        <div className="panel-header"><div><span className="helper-text">Empresas-alvo</span><h2>Pesquisa manual</h2></div><strong>{companies.length}</strong></div>
        <div className="job-filters"><label>Busca<input placeholder="Empresa, setor, local ou contato" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label><label>Favoritas<select value={filters.favorite} onChange={(event) => setFilters({ ...filters, favorite: event.target.value })}><option value="">Todas</option><option value="true">Somente favoritas</option><option value="false">Não favoritas</option></select></label></div>
        <div className="companies-layout"><div className="job-list">{companies.map((company) => <CompanyCard company={company} selected={company.id === selectedId} onSelect={() => setSelectedId(company.id)} key={company.id} />)}{companies.length === 0 ? <div className="inline-empty"><p>Nenhuma empresa encontrada.</p></div> : null}</div><div>{selected ? <CompanyDetail company={selected} onEdit={() => editCompany(selected)} onDelete={() => void removeCompany(selected)} onEditContact={editContact} onDeleteContact={(contact) => void removeContact(contact)} /> : null}</div></div>
      </section>

      {selected ? <section className="panel contact-form-panel"><div className="panel-header"><div><span className="helper-text">{selected.name}</span><h2>{editingContactId ? "Editar contato" : "Novo contato"}</h2></div>{editingContactId ? <button type="button" className="ghost-button" onClick={() => { setEditingContactId(null); setContactForm(emptyContactForm); }}>Cancelar</button> : null}</div><form className="answer-form" onSubmit={submitContact}><div className="two-column"><label>Nome<input required maxLength={200} value={contactForm.name} onChange={(event) => updateContact("name", event.target.value)} /></label><label>Função<input maxLength={200} value={contactForm.role} onChange={(event) => updateContact("role", event.target.value)} /></label></div><div className="two-column"><label>E-mail<input type="email" value={contactForm.email} onChange={(event) => updateContact("email", event.target.value)} /></label><label>LinkedIn<input type="url" placeholder="https://linkedin.com/in/..." value={contactForm.linkedinUrl} onChange={(event) => updateContact("linkedinUrl", event.target.value)} /></label></div><label>Último contato<input type="date" value={contactForm.lastContactAt} onChange={(event) => updateContact("lastContactAt", event.target.value)} /></label><label>Observações<textarea rows={4} maxLength={5000} value={contactForm.notes} onChange={(event) => updateContact("notes", event.target.value)} /></label><button type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : editingContactId ? "Salvar contato" : "Adicionar contato"}</button></form></section> : null}
    </>
  );
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}
