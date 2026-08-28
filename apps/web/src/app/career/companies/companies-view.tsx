import * as React from "react";
import type { Company, CompanyContact } from "../../../lib/types";

export function buildCompanyQuery(filters: { search: string; favorite: string }) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.favorite) params.set("favorite", filters.favorite);
  return params.toString();
}

export function CompanyCard({ company, selected, onSelect }: { company: Company; selected?: boolean; onSelect?: () => void }) {
  return (
    <button type="button" className={`job-card ${selected ? "selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
      <span className="job-card-heading"><strong>{company.name}</strong>{company.favorite ? <span>Favorita</span> : null}</span>
      <span>{company.industry ?? "Setor não informado"}</span>
      <small>{locationLabel(company)} · {company.opportunities.length} vaga(s) · {company.contacts.length} contato(s)</small>
    </button>
  );
}

export function CompanyDetail({ company, onEdit, onDelete, onEditContact, onDeleteContact }: {
  company: Company;
  onEdit?: () => void;
  onDelete?: () => void;
  onEditContact?: (contact: CompanyContact) => void;
  onDeleteContact?: (contact: CompanyContact) => void;
}) {
  return (
    <section className="panel company-detail" aria-label="Detalhe da empresa">
      <div className="panel-header">
        <div><span className="helper-text">{company.industry ?? "Empresa-alvo"}</span><h2>{company.name}{company.favorite ? " (favorita)" : ""}</h2></div>
        <div className="actions"><button type="button" className="ghost-button" onClick={onEdit}>Editar</button><button type="button" className="danger-button" onClick={onDelete}>Excluir</button></div>
      </div>
      <div className="job-meta"><span>{locationLabel(company)}</span>{company.size ? <span>{company.size}</span> : null}</div>
      <div className="company-links">
        {company.website ? <a className="text-link" href={company.website} target="_blank" rel="noreferrer">Website</a> : null}
        {company.linkedinUrl ? <a className="text-link" href={company.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
      </div>
      {company.workCulture ? <div><h3>Cultura e ambiente</h3><p className="preserved-text">{company.workCulture}</p></div> : null}
      {company.notes ? <div><h3>Pesquisa e observações</h3><p className="preserved-text">{company.notes}</p></div> : null}
      <section><h3>Vagas associadas</h3>{company.opportunities.length ? <div className="company-opportunities">{company.opportunities.map((job) => <article key={job.id}><strong>{job.title}</strong><span>{job.seniority} · {job.country} · {job.status}</span></article>)}</div> : <p className="helper-text">Nenhuma vaga associada.</p>}</section>
      <section>
        <h3>Contatos</h3>
        {company.contacts.length ? <div className="company-contacts">{company.contacts.map((contact) => <ContactCard contact={contact} onEdit={() => onEditContact?.(contact)} onDelete={() => onDeleteContact?.(contact)} key={contact.id} />)}</div> : <p className="helper-text">Nenhum contato registrado.</p>}
      </section>
    </section>
  );
}

export function ContactCard({ contact, onEdit, onDelete }: { contact: CompanyContact; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <article className="contact-card">
      <div><strong>{contact.name}</strong><span>{contact.role ?? "Função não informada"}</span></div>
      {contact.email ? <a className="text-link" href={`mailto:${contact.email}`}>{contact.email}</a> : null}
      {contact.linkedinUrl ? <a className="text-link" href={contact.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
      {contact.lastContactAt ? <small>Último contato: {formatDate(contact.lastContactAt)}</small> : null}
      {contact.notes ? <p className="preserved-text">{contact.notes}</p> : null}
      <div className="actions"><button type="button" className="ghost-button" onClick={onEdit}>Editar</button><button type="button" className="danger-button" onClick={onDelete}>Remover</button></div>
    </article>
  );
}

function locationLabel(company: Pick<Company, "city" | "country">) {
  return [company.city, company.country].filter(Boolean).join(", ") || "Local não informado";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}
