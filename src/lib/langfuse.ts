import { LangfuseClient } from "@langfuse/client";

type PrivacyMode = "demo" | "private";

type TracePayloadInput = {
  privacyMode: PrivacyMode;
  sourceHash: string;
  sourceLength: number;
  stage: "knowledge.ingest" | "knowledge.answer";
  promptVersion: string;
  model: string;
  rawInput?: string;
  rawOutput?: string;
};

export type TracePayload = {
  metadata: Record<string, string>;
  input?: string;
  output?: string;
};

export function isLangfuseConfigured(): boolean {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY,
  );
}

export function getLangfuseClient(): LangfuseClient | null {
  if (!isLangfuseConfigured()) {
    return null;
  }

  return new LangfuseClient({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
  });
}

export function createTracePayload(input: TracePayloadInput): TracePayload {
  const metadata = {
    privacyMode: input.privacyMode,
    sourceHash: input.sourceHash,
    sourceLengthBucket: toLengthBucket(input.sourceLength),
    stage: input.stage,
    promptVersion: input.promptVersion,
    model: input.model,
  };

  if (input.privacyMode === "private") {
    return { metadata };
  }

  return {
    metadata,
    input: input.rawInput,
    output: input.rawOutput,
  };
}

function toLengthBucket(length: number): string {
  if (length < 1_000) {
    return "0-999";
  }

  if (length < 5_000) {
    return "1000-4999";
  }

  return "5000+";
}
