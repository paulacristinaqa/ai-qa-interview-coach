import {
  careerAnalysisSchema,
  careerDocumentPackSchema,
  competencyEvaluationSchema,
  jobAnalysisSchema
} from "../ai-output-schemas";
import { PromptTemplate } from "./prompt-template.types";

const careerSafetyRules = [
  "Do not infer protected characteristics.",
  "Do not promise hiring outcomes.",
  "Do not invent candidate experience or vacancy requirements.",
  "Exclude contact details and personal identifiers from output."
];

export const careerPromptTemplates: PromptTemplate[] = [
  {
    id: "career.opportunity-analysis",
    domain: "career",
    task: "career-analysis",
    version: "1.0.0",
    objective: "Compare a QA opportunity with supplied candidate evidence without making hiring predictions.",
    expectedInputs: ["language", "opportunity", "candidateEvidence"],
    outputFormat: "JSON with summary, fitScore, strengths, gaps and nextActions.",
    outputSchema: careerAnalysisSchema,
    safetyRules: careerSafetyRules,
    systemInstruction: "You are a cautious QA career coach. Compare only supplied evidence and return structured output.",
    criteria: ["evidence-based fit", "clear gaps", "practical next actions", "no hiring prediction"]
  },
  {
    id: "career.job-analysis",
    domain: "career",
    task: "career-analysis",
    version: "1.0.0",
    objective: "Structure a manually saved job description and compare it with explicit candidate evidence.",
    expectedInputs: ["language", "jobOpportunity", "originalDescription", "candidateEvidence"],
    outputFormat:
      "JSON with technicalSummary, responsibilities, requirements, technologies, softSkills, estimatedSeniority, profileFit, gaps and preparationPlan.",
    outputSchema: jobAnalysisSchema,
    safetyRules: careerSafetyRules,
    systemInstruction: "You are an evidence-based QA career analyst. Separate facts from estimates, preserve uncertainty and return structured output only.",
    criteria: ["faithful vacancy extraction", "evidence-based fit", "explicit gaps", "prioritized preparation", "no hiring prediction"]
  },
  {
    id: "career.competency-evaluation",
    domain: "career",
    task: "career-analysis",
    version: "1.0.0",
    objective: "Evaluate every vacancy requirement against identified candidate evidence with traceable guidance.",
    expectedInputs: ["jobOpportunity", "jobAnalysis", "evidenceCatalog"],
    outputFormat:
      "JSON with summary, overallScore and requirements containing category, importance, status, confidence, evidenceIds, rationale and documentGuidance.",
    outputSchema: competencyEvaluationSchema,
    safetyRules: [
      ...careerSafetyRules,
      "Use only evidence IDs present in the supplied catalog.",
      "A supported or partial match must cite at least one evidence ID.",
      "Missing evidence must be represented as a gap."
    ],
    systemInstruction: "You are a conservative competency evaluator. Map only explicit candidate evidence, preserve uncertainty and return structured output only.",
    criteria: ["complete requirement coverage", "evidence ID traceability", "conservative confidence", "explicit gaps"]
  },
  {
    id: "career.document-pack",
    domain: "career",
    task: "career-analysis",
    version: "2.0.0",
    objective: "Create tailored career documents using only supplied candidate facts.",
    expectedInputs: ["language", "candidateProfile", "jobOpportunity", "jobAnalysis"],
    outputFormat: "JSON with cvMarkdown, coverLetter, fitMatrix and an empty unsupportedClaims array.",
    outputSchema: careerDocumentPackSchema,
    safetyRules: [
      ...careerSafetyRules,
      "Never add employers, dates, achievements, tools, education, certifications or language proficiency not explicitly supplied.",
      "Represent missing evidence as a gap instead of improving the candidate profile.",
      "Generate documents only in the requested supported language: pt-BR or en."
    ],
    systemInstruction:
      "You are an evidence-bound career document editor. Tailor wording and ordering, but never create facts. Write the CV and cover letter in the requested language, limited to Brazilian Portuguese or English.",
    criteria: ["requested pt-BR or en language", "ATS-readable CV", "concise cover letter", "evidence traceability", "zero unsupported claims"]
  }
];
