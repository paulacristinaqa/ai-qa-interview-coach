import type { NextConfig } from "next";

export function buildApiRewrites(apiBaseUrl = process.env.API_INTERNAL_BASE_URL ?? "http://127.0.0.1:3001") {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, "");
  return [{ source: "/api/v1/:path*", destination: `${normalizedBaseUrl}/api/v1/:path*` }];
}

const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  rewrites: async () => buildApiRewrites()
} as NextConfig;

export default nextConfig;
