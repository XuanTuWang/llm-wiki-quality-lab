export type PublishableProposal = {
  id: string;
  workspaceId: string;
  page: {
    slug: string;
    title: string;
    summary: string;
  };
  claimText: string;
  evidence: Array<{
    sourceChunkId: string;
    excerpt: string;
  }>;
};

export type PublishedRevision = {
  pageId: string;
  revision: number;
  claimId: string;
  citationIds: string[];
};

export interface WikiPublishTransaction {
  approveProposal(proposalId: string): Promise<void>;
  createWikiRevision(page: PublishableProposal["page"]): Promise<{
    id: string;
    revision: number;
  }>;
  createClaim(input: {
    pageId: string;
    proposalId: string;
    text: string;
  }): Promise<{ id: string }>;
  createCitation(input: {
    claimId: string;
    sourceChunkId: string;
    excerpt: string;
  }): Promise<{ id: string }>;
}

export interface WikiPublisher {
  transaction<T>(
    operation: (transaction: WikiPublishTransaction) => Promise<T>,
  ): Promise<T>;
}

export async function publishApprovedProposal(
  publisher: WikiPublisher,
  proposal: PublishableProposal,
): Promise<PublishedRevision> {
  if (!proposal.claimText.trim()) {
    throw new Error("A published claim needs text.");
  }

  if (proposal.evidence.length === 0) {
    throw new Error("A proposal cannot be published without evidence.");
  }

  const seenSourceChunks = new Set<string>();

  for (const citation of proposal.evidence) {
    if (!citation.sourceChunkId || !citation.excerpt.trim()) {
      throw new Error("Every citation needs a source chunk and exact excerpt.");
    }

    if (seenSourceChunks.has(citation.sourceChunkId)) {
      throw new Error("A proposal cannot cite the same source chunk twice.");
    }

    seenSourceChunks.add(citation.sourceChunkId);
  }

  return publisher.transaction(async (transaction) => {
    await transaction.approveProposal(proposal.id);
    const page = await transaction.createWikiRevision(proposal.page);
    const claim = await transaction.createClaim({
      pageId: page.id,
      proposalId: proposal.id,
      text: proposal.claimText,
    });
    const citations = await Promise.all(
      proposal.evidence.map((evidence) =>
        transaction.createCitation({
          claimId: claim.id,
          sourceChunkId: evidence.sourceChunkId,
          excerpt: evidence.excerpt,
        }),
      ),
    );

    return {
      pageId: page.id,
      revision: page.revision,
      claimId: claim.id,
      citationIds: citations.map((citation) => citation.id),
    };
  });
}
