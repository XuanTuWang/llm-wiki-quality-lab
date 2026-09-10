import { resolveAnswerState } from "./evidence";

export type RetrievedEvidence = {
  sourceChunkId: string;
  excerpt: string;
  published: boolean;
};

export type AnswerPlan =
  | {
      state: "supported";
      shouldCallModel: true;
      evidence: RetrievedEvidence[];
    }
  | {
      state: "insufficient_evidence";
      shouldCallModel: false;
      evidence: [];
      message: string;
    };

export type GeneratedAnswer = {
  text: string;
  citations: Array<{
    sourceChunkId: string;
    excerpt: string;
  }>;
};

export function createAnswerPlan(
  retrievedEvidence: RetrievedEvidence[],
  minimumEvidenceCount = 1,
): AnswerPlan {
  const publishedEvidence = retrievedEvidence.filter(
    (evidence) => evidence.published,
  );
  const state = resolveAnswerState(
    publishedEvidence.length,
    minimumEvidenceCount,
  );

  if (state === "insufficient_evidence") {
    return {
      state,
      shouldCallModel: false,
      evidence: [],
      message:
        "No approved source supports this answer yet. Add or approve relevant source material first.",
    };
  }

  return {
    state: "supported",
    shouldCallModel: true,
    evidence: publishedEvidence,
  };
}

export function validateGeneratedAnswer(
  answer: GeneratedAnswer,
  allowedEvidence: RetrievedEvidence[],
): GeneratedAnswer {
  if (!answer.text.trim()) {
    throw new Error("A supported answer needs text.");
  }

  if (answer.citations.length === 0) {
    throw new Error("A supported answer needs at least one citation.");
  }

  const allowedCitations = new Map(
    allowedEvidence.map((evidence) => [
      evidence.sourceChunkId,
      evidence.excerpt,
    ]),
  );

  for (const citation of answer.citations) {
    if (allowedCitations.get(citation.sourceChunkId) !== citation.excerpt) {
      throw new Error("An answer citation must match retrieved evidence exactly.");
    }
  }

  return answer;
}
