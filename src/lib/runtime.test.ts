import { describe, expect, it } from "vitest";
import { getRuntimeConfiguration } from "./runtime";

describe("runtime configuration", () => {
  it("never exposes values and reports each required service independently", () => {
    expect(
      getRuntimeConfiguration({
        DATABASE_URL: "postgres://redacted",
        LLM_API_KEY: "redacted",
        LLM_MODEL: "gpt-compatible-model",
      }),
    ).toEqual({
      databaseConfigured: true,
      llmConfigured: true,
      langfuseConfigured: false,
    });
  });
});
