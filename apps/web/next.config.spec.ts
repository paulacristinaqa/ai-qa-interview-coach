import { describe, expect, it } from "vitest";
import { buildApiRewrites } from "./next.config";

describe("Next.js API proxy", () => {
  it("forwards browser API calls to the internal API service", () => {
    expect(buildApiRewrites("http://api:3001/")).toEqual([{
      source: "/api/v1/:path*",
      destination: "http://api:3001/api/v1/:path*"
    }]);
  });
});
