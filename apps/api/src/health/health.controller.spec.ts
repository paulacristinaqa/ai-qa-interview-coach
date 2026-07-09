import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns service health", () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: "ok",
      service: "ai-qa-interview-coach-api"
    });
  });
});

