import { describe, expect, it } from "vitest";
import {
  extractWikiProposals,
  type GenerateStructuredInput,
  type LLMProvider,
} from "./proposals";

const input: GenerateStructuredInput = {
  promptName: "extract-wiki-proposal",
  promptVersion: "v0.1",
  sourceVersionId: "bcf5542e-3d12-4fd7-b8d7-7175906fa5d6",
  sourceChunks: [
    {
      id: "9ebdfc27-f26d-4086-a5a0-bc2e082a5d2a",
      body: "A reviewer approves a source-backed change.",
    },
  ],
};

describe("extract-wiki-proposal contract", () => {
  it("accepts source-linked structured proposals", async () => {
    const provider: LLMProvider = {
      generateWikiProposals: async () => ({
        proposedChanges: [
          {
            type: "claim",
            title: "Human review boundary",
            summary: "A reviewer approves source-backed changes.",
            evidenceChunkIds: [input.sourceChunks[0].id],
            confidence: 0.9,
          },
        ],
      }),
    };

    await expect(extractWikiProposals(provider, input)).resolves.toMatchObject({
      proposedChanges: [{ type: "claim", confidence: 0.9 }],
    });
  });

  it("rejects proposals without evidence IDs before review", async () => {
    const provider: LLMProvider = {
      generateWikiProposals: async () => ({
        proposedChanges: [
          {
            type: "claim",
            title: "Unsupported claim",
            summary: "The model did not provide an evidence reference.",
            evidenceChunkIds: [],
            confidence: 0.9,
          },
        ],
      }),
    };

    await expect(extractWikiProposals(provider, input)).rejects.toThrow(
      "Too small",
    );
  });

  it("rejects references to chunks outside the analyzed source version", async () => {
    const provider: LLMProvider = {
      generateWikiProposals: async () => ({
        proposedChanges: [
          {
            type: "claim",
            title: "Cross-source claim",
            summary: "This points to a chunk that was not part of this run.",
            evidenceChunkIds: ["774cee15-c14e-4f83-9e39-b57a067d9257"],
            confidence: 0.8,
          },
        ],
      }),
    };

    await expect(extractWikiProposals(provider, input)).rejects.toThrow(
      "outside of this source version",
    );
  });
});
