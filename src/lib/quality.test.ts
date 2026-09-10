import { describe, expect, it } from "vitest";
import { buildQualityDashboard, buildTraceUrl } from "./quality";

const runs = [
  {
    id: "run-1",
    traceId: "trace-1",
    promptVersion: "v0.2",
    durationMs: 820,
    scores: {
      citation_support: 0.7,
      groundedness: 0.6,
      appropriate_refusal: 1,
    },
  },
  {
    id: "run-2",
    traceId: "trace-2",
    promptVersion: "v0.3",
    durationMs: 680,
    scores: {
      citation_support: 0.9,
      groundedness: 0.8,
      appropriate_refusal: 1,
    },
  },
  {
    id: "run-3",
    traceId: "trace-3",
    promptVersion: "v0.3",
    durationMs: 540,
    scores: {},
  },
] as const;

describe("Quality Lab aggregation", () => {
  it("builds comparable prompt scores and an accessible run table model", () => {
    const dashboard = buildQualityDashboard([...runs]);

    expect(dashboard).toMatchObject({
      kpis: {
        citationSupport: 0.8,
        groundedness: 0.7,
        appropriateRefusal: 1,
        evaluationCoverage: { scoredRuns: 2, totalRuns: 3 },
      },
      promptComparison: [
        { promptVersion: "v0.2", citationSupport: 0.7, runCount: 1 },
        { promptVersion: "v0.3", citationSupport: 0.9, runCount: 2 },
      ],
    });
    expect(dashboard.runTable).toEqual([
      {
        id: "run-1",
        traceId: "trace-1",
        promptVersion: "v0.2",
        durationMs: 820,
        scored: true,
      },
      {
        id: "run-2",
        traceId: "trace-2",
        promptVersion: "v0.3",
        durationMs: 680,
        scored: true,
      },
      {
        id: "run-3",
        traceId: "trace-3",
        promptVersion: "v0.3",
        durationMs: 540,
        scored: false,
      },
    ]);
  });

  it("creates a trace deep link without leaking a secret", () => {
    expect(
      buildTraceUrl("https://cloud.langfuse.com/", "trace / 1"),
    ).toBe("https://cloud.langfuse.com/trace/trace%20%2F%201");
  });
});
