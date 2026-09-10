import { describe, expect, it } from "vitest";
import {
  publishApprovedProposal,
  type WikiPublishTransaction,
  type WikiPublisher,
} from "./publishing";

const proposal = {
  id: "proposal-1",
  workspaceId: "workspace-1",
  page: {
    slug: "evidence-first-ai",
    title: "Evidence-first AI",
    summary: "Source-linked knowledge.",
  },
  claimText: "Only source-backed proposals become published knowledge.",
  evidence: [
    {
      sourceChunkId: "chunk-1",
      excerpt: "A reviewer verifies the evidence before publishing.",
    },
  ],
};

function createPublisher(options?: { failCitation?: boolean }) {
  const writes: string[] = [];
  const transaction: WikiPublishTransaction = {
    approveProposal: async () => { writes.push("approve"); },
    createWikiRevision: async () => {
      writes.push("revision");
      return { id: "page-1", revision: 2 };
    },
    createClaim: async () => {
      writes.push("claim");
      return { id: "claim-1" };
    },
    createCitation: async () => {
      if (options?.failCitation) {
        throw new Error("citation write failed");
      }

      writes.push("citation");
      return { id: "citation-1" };
    },
  };
  const publisher: WikiPublisher = {
    transaction: async (operation) => {
      const startingWriteCount = writes.length;

      try {
        return await operation(transaction);
      } catch (error) {
        writes.splice(startingWriteCount);
        throw error;
      }
    },
  };

  return { publisher, writes };
}

describe("publishApprovedProposal", () => {
  it("publishes approval, revision, claim, and citation in one transaction", async () => {
    const { publisher, writes } = createPublisher();

    await expect(publishApprovedProposal(publisher, proposal)).resolves.toEqual({
      pageId: "page-1",
      revision: 2,
      claimId: "claim-1",
      citationIds: ["citation-1"],
    });
    expect(writes).toEqual(["approve", "revision", "claim", "citation"]);
  });

  it("refuses to publish without a source excerpt", async () => {
    const { publisher, writes } = createPublisher();

    await expect(
      publishApprovedProposal(publisher, { ...proposal, evidence: [] }),
    ).rejects.toThrow("without evidence");
    expect(writes).toEqual([]);
  });

  it("rolls back all writes if a citation fails", async () => {
    const { publisher, writes } = createPublisher({ failCitation: true });

    await expect(publishApprovedProposal(publisher, proposal)).rejects.toThrow(
      "citation write failed",
    );
    expect(writes).toEqual([]);
  });
});
