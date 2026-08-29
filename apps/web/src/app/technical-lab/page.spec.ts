import { describe, expect, it } from "vitest";
import type { TechnicalChallenge } from "../../lib/types";
import { selectChallengeId } from "./page";

const challenges: TechnicalChallenge[] = [
  { id: "challenge-1", area: "API", title: "API risks", difficulty: "basic", context: "Analyze risks." },
  { id: "challenge-2", area: "Automation", title: "Automation strategy", difficulty: "advanced", context: "Choose an approach." }
];

describe("Technical Lab recommended challenge navigation", () => {
  it("selects an existing challenge requested by the preparation plan", () => {
    expect(selectChallengeId(challenges, "challenge-1", "challenge-2")).toBe("challenge-2");
  });

  it("falls back safely when a persisted resource no longer exists", () => {
    expect(selectChallengeId(challenges, "", "deleted-challenge")).toBe("challenge-1");
  });
});
