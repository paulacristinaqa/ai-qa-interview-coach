"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { JsonRecord } from "../../lib/types";

export default function KnowledgeBasePage() {
  const { api } = useAuth();
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [history, setHistory] = useState<JsonRecord | null>(null);
  const [filters, setFilters] = useState({ search: "", type: "", tag: "" });
  const [form, setForm] = useState({ type: "learning", title: "Aprendizado de QA", body: "Registrar evidencia ou conceito aprendido." });
  const [exportText, setExportText] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.type) params.set("type", filters.type);
    if (filters.tag) params.set("tag", filters.tag);
    try {
      const query = params.toString();
      const [itemData, historyData] = await Promise.all([api<JsonRecord[]>(query ? `/knowledge?${query}` : "/knowledge"), api<JsonRecord>("/knowledge/history")]);
      setItems(itemData); setHistory(historyData); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o conhecimento."); }
  }, [api, filters]);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await api<JsonRecord>("/knowledge", { method: "POST", body: JSON.stringify(form) }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a nota."); }
  }

  async function exportMarkdown() {
    try { setExportText((await api<{ markdown: string }>("/knowledge/export")).markdown); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel exportar."); }
  }

  return (
    <>
      <PageHeader eyebrow="Evidence library" title="Knowledge Base" description="Notas, aprendizados e historico pesquisavel em um unico lugar." action={<button onClick={() => void load()}>Atualizar</button>} />
      <StatusMessage message={message} />
      <div className="two-column">
        <section className="panel">
          <h2>Nova nota</h2>
          <form className="answer-form" onSubmit={create}><label>Tipo<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /></label><label>Titulo<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Conteudo<textarea rows={6} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label><div className="actions"><button>Salvar nota</button><button type="button" className="ghost-button" onClick={exportMarkdown}>Exportar Markdown</button></div></form>
        </section>
        <section className="panel">
          <h2>Biblioteca</h2>
          <div className="config-grid"><label>Busca<input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></label><label>Tipo<input value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })} /></label><label>Tag<input value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })} /></label></div>
          <p className="helper-text">{items.length} itens salvos · historico carregado: {history ? "sim" : "nao"}</p>
          <div className="history-list">{items.map((item, index) => <div key={String(item.id ?? index)}><span>{String(item.type ?? "nota")}</span><strong>{String(item.title ?? "Sem titulo")}</strong><p>{String(item.body ?? "")}</p></div>)}</div>
        </section>
      </div>
      {exportText ? <section className="panel export-panel"><h2>Exportacao Markdown</h2><textarea readOnly rows={12} value={exportText} /></section> : null}
    </>
  );
}
