import { describe, expect, it } from "vitest";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  it("returns initial dashboard without fake historical evidence", async () => {
    const service = new DashboardService();

    const dashboard = await service.getDashboard({
      id: "single-user",
      name: "Paula QA Tester",
      email: "paula@example.com",
      locale: "pt-BR"
    });

    expect(dashboard.cri.confidenceLevel).toBe("low");
    expect(dashboard.emptyState.message).toContain("evidencias reais");
    expect(dashboard.shortcuts).toHaveLength(4);
    expect(dashboard.priorityCards[0].title).toBe("Entrevista da semana");
    expect(dashboard.weeklyProgress.completedSessions).toBe(0);
    expect(dashboard.recentHistory).toHaveLength(0);
  });
});
