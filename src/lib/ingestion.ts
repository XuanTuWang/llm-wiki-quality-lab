export type TextChunk = {
  body: string;
  ordinal: number;
  startOffset: number;
  endOffset: number;
};

export function normalizeSourceText(source: string): string {
  return source.replace(/\r\n?/g, "\n").trim();
}

export async function sha256(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeSourceText(source));
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function chunkText(source: string, maxCharacters = 800): TextChunk[] {
  const body = normalizeSourceText(source);

  if (!body) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let cursor = 0;

  while (cursor < body.length) {
    const maximumEnd = Math.min(cursor + maxCharacters, body.length);
    let end = maximumEnd;

    if (maximumEnd < body.length) {
      const candidate = findNaturalBreak(body.slice(cursor, maximumEnd));

      if (candidate > Math.floor(maxCharacters * 0.45)) {
        end = cursor + candidate;
      }
    }

    const rawSlice = body.slice(cursor, end);
    const leadingWhitespace = rawSlice.length - rawSlice.trimStart().length;
    const trailingWhitespace = rawSlice.length - rawSlice.trimEnd().length;
    const chunkBody = rawSlice.trim();

    if (chunkBody) {
      chunks.push({
        body: chunkBody,
        ordinal: chunks.length,
        startOffset: cursor + leadingWhitespace,
        endOffset: end - trailingWhitespace,
      });
    }

    cursor = end;
  }

  return chunks;
}

function findNaturalBreak(slice: string): number {
  const paragraph = slice.lastIndexOf("\n\n");
  const newline = slice.lastIndexOf("\n");
  const sentence = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("。"),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
  );

  if (paragraph > 0) {
    return paragraph;
  }

  if (newline > 0) {
    return newline;
  }

  return sentence > 0 ? sentence + 1 : slice.length;
}
