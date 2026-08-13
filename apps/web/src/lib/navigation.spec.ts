import { describe, expect, it } from "vitest";
import { navigationGroups } from "./navigation";

describe("workspace navigation", () => {
  it("exposes every implemented domain route", () => {
    const routes = navigationGroups.flatMap((group) => group.items.map((item) => item.href));
    expect(routes).toEqual(expect.arrayContaining([
      "/dashboard", "/interviews", "/grill-me", "/technical-lab", "/knowledge-base", "/developer-diary", "/settings"
    ]));
  });

  it("keeps all Career Intelligence placeholders available", () => {
    const career = navigationGroups.find((group) => group.label === "Career Intelligence");
    expect(career?.items.map((item) => item.href)).toEqual([
      "/career/jobs", "/career/applications", "/career/companies", "/career/documents"
    ]);
  });
});
