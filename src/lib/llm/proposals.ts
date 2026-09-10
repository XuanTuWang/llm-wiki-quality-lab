import { z } from "zod";

export const proposalTypeSchema = z.enum(["concept", "claim", "link"]);

export const proposedChangeSchema = z.object({
  type: proposalTypeSchema,
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().min(1).max(2_000),
  evidenceChunkIds: z.array(z.uuid()).min(1),
  confidence: z.number().min(0).max(1),
});

export const extractionResultSchema = z.object({
  proposedChanges: z.array(proposedChangeSchema).min(1).max(50),
});

export type ProposedChangeOutput = z.infer<typeof proposedChangeSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export type GenerateStructuredInput = {
  promptName: "extract-wiki-proposal";
  promptVersion: string;
  sourceVersionId: string;
  sourceChunks: Array<{ id: string; body: string }>;
};

export interface LLMProvider {
  generateWikiProposals(input: GenerateStructuredInput): Promise<unknown>;
}

export async function extractWikiProposals(
  provider: LLMProvider,
  input: GenerateStructuredInput,
): Promise<ExtractionResult> {
  const rawResult = await provider.generateWikiProposals(input);
  const result = extractionResultSchema.parse(rawResult);
  const availableChunkIds = new Set(input.sourceChunks.map((chunk) => chunk.id));

  for (const change of result.proposedChanges) {
    if (!change.evidenceChunkIds.every((id) => availableChunkIds.has(id))) {
      throw new Error(
        "A proposed change referenced evidence outside of this source version.",
      );
    }
  }

  return result;
}
