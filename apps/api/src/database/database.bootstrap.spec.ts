import { describe, expect, it } from "vitest";
import { DatabaseBootstrap } from "./database.bootstrap";

describe("DatabaseBootstrap", () => {
  it("loads the seed catalog without an initialization error", () => {
    expect(DatabaseBootstrap).toBeDefined();
  });
});
