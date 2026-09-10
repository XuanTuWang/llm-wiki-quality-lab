import { describe, expect, it } from "vitest";
import { canPublishProposal, resolveAnswerState } from "./evidence";

describe("evidence publication guard", () => {
  const chunks = [
    { id: "chunk-approved", approved: true },
    { id: "chunk-draft", approved: false },
  ];

  it("never publishes a proposal without approved source evidence", () => {
    expect(canPublishProposal({ evidenceChunkIds: [] }, chunks)).toBe(false);
    expect(
      canPublishProposal({ evidenceChunkIds: ["chunk-draft"] }, chunks),
    ).toBe(false);
  });

  it("allows a proposal only when every cited chunk is approved", () => {
    expect(
      canPublishProposal({ evidenceChunkIds: ["chunk-approved"] }, chunks),
    ).toBe(true);
  });
});

describe("evidence threshold", () => {
  it("returns an explicit refusal state below the threshold", () => {
    expect(resolveAnswerState(0)).toBe("insufficient_evidence");
    expect(resolveAnswerState(1)).toBe("supported");
  });
});
