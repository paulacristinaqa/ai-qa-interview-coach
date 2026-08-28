import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CareerDocument } from "../../../lib/types";
import { buildDocumentExport, CareerDocumentCard, CareerDocumentDetail } from "./documents-view";

const document: CareerDocument = {
  id: "document-1",
  opportunityId: "job-1",
  language: "pt-BR",
  candidateProfile: "Cinco anos testando APIs e criando automação com Playwright.",
  cvMarkdown: "# Perfil\nQA Engineer com experiência em APIs.",
  coverLetter: "Tenho interesse na vaga e experiência comprovada em APIs.",
  fitMatrix: [
    { requirement: "Testes de API", evidence: "Cinco anos testando APIs.", status: "supported" },
    { requirement: "Docker", evidence: "Nenhuma evidência informada.", status: "gap" }
  ],
  sourceEvidenceIds: ["evidence-1"],
  providerName: "mock",
  modelName: "deterministic",
  promptTemplateVersion: "career.document-pack@2.1.0",
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
  opportunity: {
    id: "job-1",
    title: "Senior QA Engineer",
    company: "Example Labs",
    country: "Portugal",
    city: "Lisboa",
    workModel: "hybrid",
    seniority: "Senior",
    language: "Portuguese"
  }
};

describe("Career Documents frontend", () => {
  it("renders the saved package and its conservative fit matrix", () => {
    const markup = renderToStaticMarkup(<><CareerDocumentCard document={document} /><CareerDocumentDetail document={document} /></>);

    expect(markup).toContain("Senior QA Engineer");
    expect(markup).toContain("CV direcionado");
    expect(markup).toContain("Carta de apresentação");
    expect(markup).toContain("Testes de API");
    expect(markup).toContain("Comprovado");
    expect(markup).toContain("Lacuna");
    expect(markup).toContain("career.document-pack@2.1.0");
  });

  it("exports all sections as Markdown", () => {
    const exported = buildDocumentExport(document);

    expect(exported).toContain("## CV direcionado");
    expect(exported).toContain("## Carta de apresentação");
    expect(exported).toContain("## Matriz de aderência");
    expect(exported).toContain("**Docker** — Lacuna");
  });
});
