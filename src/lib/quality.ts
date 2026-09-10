export type QualityScoreName =
  | "citation_support"
  | "groundedness"
  | "appropriate_refusal";

export type QualityRun = {
  id: string;
  traceId: string;
  promptVersion: string;
  durationMs: number;
  scores: Partial<Record<QualityScoreName, number>>;
};

export type QualityDashboard = {
  kpis: {
    citationSupport: number | null;
    groundedness: number | null;
    appropriateRefusal: number | null;
    evaluationCoverage: { scoredRuns: number; totalRuns: number };
  };
  promptComparison: Array<{
    promptVersion: string;
    citationSupport: number | null;
    groundedness: number | null;
    appropriateRefusal: number | null;
    runCount: number;
  }>;
  runTable: Array<{
    id: string;
    traceId: string;
    promptVersion: string;
    durationMs: number;
    scored: boolean;
  }>;
};

export function buildQualityDashboard(runs: QualityRun[]): QualityDashboard {
  const byPrompt = new Map<string, QualityRun[]>();
  for (const run of runs) {
    byPrompt.set(run.promptVersion, [
      ...(byPrompt.get(run.promptVersion) ?? []),
      run,
    ]);
  }

  return {
    kpis: {
      citationSupport: averageFor(runs, "citation_support"),
      groundedness: averageFor(runs, "groundedness"),
      appropriateRefusal: averageFor(runs, "appropriate_refusal"),
      evaluationCoverage: {
        scoredRuns: runs.filter((run) => Object.keys(run.scores).length > 0)
          .length,
        totalRuns: runs.length,
      },
    },
    promptComparison: Array.from(byPrompt, ([promptVersion, promptRuns]) => ({
      promptVersion,
      citationSupport: averageFor(promptRuns, "citation_support"),
      groundedness: averageFor(promptRuns, "groundedness"),
      appropriateRefusal: averageFor(promptRuns, "appropriate_refusal"),
      runCount: promptRuns.length,
    })),
    runTable: runs.map((run) => ({
      id: run.id,
      traceId: run.traceId,
      promptVersion: run.promptVersion,
      durationMs: run.durationMs,
      scored: Object.keys(run.scores).length > 0,
    })),
  };
}

export function buildTraceUrl(baseUrl: string, traceId: string): string {
  return (
    baseUrl.replace(/\/$/, "") +
    "/trace/" +
    encodeURIComponent(traceId)
  );
}

function averageFor(
  runs: QualityRun[],
  score: QualityScoreName,
): number | null {
  const values = runs
    .map((run) => run.scores[score])
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) {
    return null;
  }

  return Math.round(
    (values.reduce((sum, value) => sum + value, 0) / values.length) * 100,
  ) / 100;
}
