const apiBaseUrl = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:3001/api/v1";
const email = process.env.E2E_EMAIL ?? "paula@example.com";
const password = process.env.E2E_PASSWORD ?? "change-me-locally";

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method ?? "GET"} ${path} failed with ${response.status}: ${body}`);
  }
  return response.json();
}

const auth = await request("/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password })
});

const headers = { Authorization: `Bearer ${auth.accessToken}` };
await request("/dashboard", { headers });
await request("/questions/topics", { headers });
await request("/technical-lab/challenges", { headers });
await request("/cri/current", { headers });
await request("/diary/suggestions", { headers });

console.log("E2E smoke passed");
