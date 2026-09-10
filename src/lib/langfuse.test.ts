import { describe, expect, it } from "vitest";
import { createTracePayload } from "./langfuse";

describe("Langfuse privacy payloads", () => {
  const base = {
    sourceHash: "a90e7d2",
    sourceLength: 1420,
    stage: "knowledge.ingest" as const,
    promptVersion: "v0.3",
    model: "demo-model",
    rawInput: "Private source text must not leave the workspace.",
    rawOutput: "Private generated answer must not leave the workspace.",
  };

  it("removes raw input and output for private knowledge", () => {
    expect(
      createTracePayload({
        ...base,
        privacyMode: "private",
      }),
    ).toEqual({
      metadata: {
        privacyMode: "private",
        sourceHash: "a90e7d2",
        sourceLengthBucket: "1000-4999",
        stage: "knowledge.ingest",
        promptVersion: "v0.3",
        model: "demo-model",
      },
    });
  });

  it("allows public demo payloads to be traced", () => {
    expect(
      createTracePayload({
        ...base,
        privacyMode: "demo",
      }),
    ).toMatchObject({
      input: base.rawInput,
      output: base.rawOutput,
    });
  });
});
