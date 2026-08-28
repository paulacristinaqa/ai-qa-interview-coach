const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3001/api/v1";
const email = process.env.E2E_EMAIL ?? "paula@example.com";
const password = process.env.E2E_PASSWORD ?? "change-me-locally";

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? "GET"} ${path} failed with ${response.status}: ${body}`);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

const auth = await request("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password })
});
assert.ok(auth.accessToken, "login should return an access token");

const headers = { Authorization: `Bearer ${auth.accessToken}` };
const session = await request("/interviews", {
  method: "POST",
  headers,
  body: JSON.stringify({
    language: "en",
    targetRole: "QA Automation Engineer",
    seniority: "Senior",
    topic: "API Testing",
    difficulty: "advanced"
  })
});
assert.equal(session.status, "started");
assert.ok(session.turns[0]?.question, "interview should start with a question");

const answered = await request(`/interviews/${session.id}/answers`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    answer: "I would clarify the API contract, cover success and failure paths, control test data, and collect observable evidence for regression risk."
  })
});
assert.ok(answered.turns[0]?.answer, "the first answer should be persisted");
assert.ok(answered.turns[1]?.question, "the interview should return a follow-up question");

const completed = await request(`/interviews/${session.id}/complete`, { method: "POST", headers });
assert.equal(completed.status, "completed");

const feedback = await request(`/feedback/sessions/${session.id}`, { method: "POST", headers });
assert.ok(feedback.overallSummary, "feedback should include a summary");
assert.ok(feedback.dimensions?.length >= 4, "feedback should include scored dimensions");

const cri = await request("/cri/current", { headers });
assert.equal(typeof cri.score, "number");
assert.ok(cri.composition?.evidenceCount >= 1, "CRI should include the interview evidence");

const diaryTitle = `E2E interview history ${session.id}`;
const diaryEntry = await request("/diary/entries", {
  method: "POST",
  headers,
  body: JSON.stringify({
    entryType: "changelog",
    title: diaryTitle,
    context: "Automated smoke interview flow",
    decision: `Feedback ${feedback.id} generated and CRI updated to ${cri.score}.`,
    nextSteps: "Keep this entry as regression evidence."
  })
});
assert.equal(diaryEntry.title, diaryTitle);

const history = await request("/knowledge/history", { headers });
assert.ok(history.interviews?.some((item) => item.id === session.id), "history should contain the completed interview");
const diaryEntries = await request("/diary/entries", { headers });
assert.ok(diaryEntries.some((item) => item.id === diaryEntry.id), "Developer Diary should contain the smoke entry");

const opportunity = await request("/job-opportunities", {
  method: "POST",
  headers,
  body: JSON.stringify({
    title: `E2E QA Engineer ${Date.now()}`,
    company: "E2E Example Labs",
    country: "Portugal",
    workModel: "remote",
    seniority: "Senior",
    language: "English",
    originalDescription: "Own API quality, automation strategy and release evidence."
  })
});
const company = await request("/companies", {
  method: "POST",
  headers,
  body: JSON.stringify({
    name: `E2E Example Labs ${Date.now()}`,
    website: "https://example.com",
    country: "Portugal",
    industry: "Technology",
    favorite: true,
    opportunityIds: [opportunity.id]
  })
});
assert.ok(company.opportunities.some((item) => item.id === opportunity.id), "company should explicitly connect the owned opportunity");

const companyContact = await request(`/companies/${company.id}/contacts`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "E2E Recruiter", role: "Technical Recruiter", email: "recruiter@example.com" })
});
assert.equal(companyContact.companyId, company.id);
const companies = await request("/companies?search=E2E&favorite=true", { headers });
assert.ok(companies.some((item) => item.id === company.id), "company should be visible with search and favorite filters");

const targetedGrill = await request("/grill-me/sessions", {
  method: "POST",
  headers,
  body: JSON.stringify({
    topic: "API Testing",
    language: "en",
    level: "advanced",
    mode: "realistic",
    opportunityId: opportunity.id
  })
});
assert.equal(targetedGrill.session.targetRole, opportunity.title);
assert.ok(targetedGrill.session.interviewerStyle.includes(opportunity.id), "targeted Grill Me should preserve the opportunity reference");
assert.ok(targetedGrill.session.turns[0].question.includes(opportunity.title), "opening question should reference the vacancy");

const targetedFollowUp = await request(`/grill-me/sessions/${targetedGrill.session.id}/answers`, {
  method: "POST",
  headers,
  body: JSON.stringify({ answer: "I would map API contract risks, automate critical paths, isolate test data and report release evidence." })
});
assert.ok(targetedFollowUp.session.turns[1]?.question.includes("this role"), "follow-up should remain grounded in the vacancy");

const application = await request("/job-applications", {
  method: "POST",
  headers,
  body: JSON.stringify({
    opportunityId: opportunity.id,
    status: "applied",
    appliedAt: "2026-08-27",
    nextAction: "Prepare recruiter conversation"
  })
});
const applications = await request("/job-applications?status=applied&search=E2E", { headers });
assert.ok(applications.some((item) => item.id === application.id), "application should be visible in the filtered pipeline");

const advancedApplication = await request(`/job-applications/${application.id}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ status: "interview", nextAction: "Prepare API testing examples" })
});
assert.equal(advancedApplication.status, "interview");

await request(`/job-applications/${application.id}`, { method: "DELETE", headers });
const preservedOpportunity = await request(`/job-opportunities/${opportunity.id}`, { headers });
assert.equal(preservedOpportunity.id, opportunity.id, "removing an application should preserve its opportunity");

const careerDocument = await request("/career-documents/generate", {
  method: "POST",
  headers,
  body: JSON.stringify({
    opportunityId: opportunity.id,
    language: "en",
    candidateProfile: "I own API quality, automation strategy and release evidence through five years of QA project work."
  })
});
assert.equal(careerDocument.language, "en");
assert.ok(careerDocument.cvMarkdown.includes("Tailored professional CV"), "career pack should contain the targeted CV");
assert.ok(careerDocument.coverLetter, "career pack should contain a cover letter");
assert.ok(careerDocument.fitMatrix.length >= 1, "career pack should contain a fit matrix");

const careerDocuments = await request(`/career-documents?opportunityId=${opportunity.id}`, { headers });
assert.ok(careerDocuments.some((item) => item.id === careerDocument.id), "career pack should be persisted for the vacancy");
await request(`/career-documents/${careerDocument.id}`, { method: "DELETE", headers });
await request(`/companies/${company.id}`, { method: "DELETE", headers });
const opportunityAfterCompanyRemoval = await request(`/job-opportunities/${opportunity.id}`, { headers });
assert.equal(opportunityAfterCompanyRemoval.id, opportunity.id, "removing a company should preserve its opportunity");
await request(`/job-opportunities/${opportunity.id}`, { method: "DELETE", headers });

console.log(`E2E smoke passed for interview ${session.id}, feedback, CRI, Diary and Career Intelligence modules`);
import assert from "node:assert/strict";
