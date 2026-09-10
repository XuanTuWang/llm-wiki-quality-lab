import { describe, expect, it } from "vitest";
import { createAnswerPlan, validateGeneratedAnswer } from "./answers";

const publishedEvidence = {
  sourceChunkId: "chunk-1",
  excerpt: "A reviewer verifies the evidence before publishing.",
  published: true,
};

describe("answer evidence gate", () => {
  it("does not call a model when no approved evidence exists", () => {
    expect(
      createAnswerPlan([
        {
          ...publishedEvidence,
          published: false,
        },
      ]),
    ).toMatchObject({
      state: "insufficient_evidence",
      shouldCallModel: false,
    });
  });

  it("uses only published evidence in a supported plan", () => {
    expect(
      createAnswerPlan([
        publishedEvidence,
        { ...publishedEvidence, sourceChunkId: "chunk-draft", published: false },
      ]),
    ).toMatchObject({
      state: "supported",
      shouldCallModel: true,
      evidence: [publishedEvidence],
    });
  });
});

describe("answer citation validator", () => {
  it("rejects a supported answer without citations", () => {
    expect(() =>
      validateGeneratedAnswer(
        { text: "A confident answer.", citations: [] },
        [publishedEvidence],
      ),
    ).toThrow("at least one citation");
  });

  it("rejects a citation that was not retrieved", () => {
    expect(() =>
      validateGeneratedAnswer(
        {
          text: "A cited answer.",
          citations: [{ sourceChunkId: "unknown", excerpt: "Invented excerpt" }],
        },
        [publishedEvidence],
      ),
    ).toThrow("match retrieved evidence");
  });
});
