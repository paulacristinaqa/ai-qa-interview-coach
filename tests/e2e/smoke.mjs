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

console.log(`E2E smoke passed for interview ${session.id}, feedback, CRI and Developer Diary history`);
import assert from "node:assert/strict";
