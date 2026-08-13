"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader, StatusMessage } from "../../components/page";
import { useAuth } from "../../components/auth-provider";
import type { JsonRecord } from "../../lib/types";

export default function DeveloperDiaryPage() {
  const { api } = useAuth();
  const [entries, setEntries] = useState<JsonRecord[]>([]);
  const [suggestions, setSuggestions] = useState<JsonRecord[]>([]);
  const [exportText, setExportText] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ entryType: "decision", title: "Decisao tecnica", context: "Contexto da decisao", decision: "Decisao tomada", nextSteps: "Proximo passo" });

  const load = useCallback(async () => {
    try {
      const [entryData, suggestionData] = await Promise.all([api<JsonRecord[]>("/diary/entries"), api<JsonRecord[]>("/diary/suggestions")]);
      setEntries(entryData); setSuggestions(suggestionData); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar o diario."); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await api<JsonRecord>("/diary/entries", { method: "POST", body: JSON.stringify(form) }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a entrada."); }
  }

  async function exportMarkdown() {
    try { setExportText((await api<{ markdown: string }>("/diary/export")).markdown); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Nao foi possivel exportar."); }
  }

  return (
    <>
      <PageHeader eyebrow="Engineering memory" title="Developer Diary" description="Decisoes, mudancas, aprendizados e proximos passos rastreaveis." action={<button onClick={() => void load()}>Atualizar</button>} />
      <StatusMessage message={message} />
      <div className="two-column">
        <section className="panel"><h2>Nova entrada</h2><form className="answer-form" onSubmit={create}><label>Tipo<input value={form.entryType} onChange={(event) => setForm({ ...form, entryType: event.target.value })} /></label><label>Titulo<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Contexto<textarea rows={3} value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} /></label><label>Decisao<textarea rows={3} value={form.decision} onChange={(event) => setForm({ ...form, decision: event.target.value })} /></label><label>Proximos passos<textarea rows={3} value={form.nextSteps} onChange={(event) => setForm({ ...form, nextSteps: event.target.value })} /></label><div className="actions"><button>Salvar entrada</button><button className="ghost-button" type="button" onClick={exportMarkdown}>Exportar Markdown</button></div></form></section>
        <section className="panel"><h2>Sugestoes</h2><div className="history-list">{suggestions.map((item, index) => <div key={`${String(item.entryType)}-${index}`}><span>{String(item.entryType)}</span><strong>{String(item.title)}</strong><p>{String(item.nextSteps ?? "")}</p></div>)}</div></section>
      </div>
      <section className="panel export-panel"><h2>Entradas recentes</h2>{entries.length ? <div className="history-list">{entries.map((item, index) => <div key={String(item.id ?? index)}><span>{String(item.entryType)}</span><strong>{String(item.title)}</strong><p>{String(item.decision ?? item.context ?? "")}</p></div>)}</div> : <p>Nenhuma entrada registrada.</p>}</section>
      {exportText ? <section className="panel export-panel"><h2>Exportacao Markdown</h2><textarea readOnly rows={12} value={exportText} /></section> : null}
    </>
  );
}
