export type EvidenceChunk = {
  id: string;
  approved: boolean;
};

export type ProposedChange = {
  evidenceChunkIds: string[];
};

export type AnswerState = "supported" | "insufficient_evidence";

export function canPublishProposal(
  proposal: ProposedChange,
  chunks: EvidenceChunk[],
): boolean {
  if (proposal.evidenceChunkIds.length === 0) {
    return false;
  }

  const approvedIds = new Set(
    chunks.filter((chunk) => chunk.approved).map((chunk) => chunk.id),
  );

  return proposal.evidenceChunkIds.every((id) => approvedIds.has(id));
}

export function resolveAnswerState(
  matchedApprovedChunkCount: number,
  minimumEvidenceCount = 1,
): AnswerState {
  return matchedApprovedChunkCount >= minimumEvidenceCount
    ? "supported"
    : "insufficient_evidence";
}
