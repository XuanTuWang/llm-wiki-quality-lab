import { describe, expect, it } from "vitest";
import { chunkText, normalizeSourceText, sha256 } from "./ingestion";

describe("source ingestion primitives", () => {
  it("normalizes line endings before hashing", async () => {
    expect(normalizeSourceText(" alpha\r\nbeta\r\n")).toBe("alpha\nbeta");
    await expect(sha256("alpha\r\nbeta\r\n")).resolves.toBe(
      "bbfb79e82216bd2db1ad2c507d44ddf80aeb12f64f9562056afe93aad43154d9",
    );
  });

  it("produces ordered chunks with source offsets", () => {
    const source = "First paragraph has evidence.\n\nSecond paragraph has more evidence.";
    const chunks = chunkText(source, 40);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({
      ordinal: 0,
      body: "First paragraph has evidence.",
      startOffset: 0,
      endOffset: 29,
    });
    expect(source.slice(chunks[1].startOffset, chunks[1].endOffset)).toBe(
      chunks[1].body,
    );
  });
});
