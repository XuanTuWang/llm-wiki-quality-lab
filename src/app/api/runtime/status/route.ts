import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { getRuntimeConfiguration } from "@/lib/runtime";

export const runtime = "nodejs";

export async function GET() {
  const configuration = getRuntimeConfiguration();
  let database: "connected" | "needs_configuration" | "unreachable" =
    "needs_configuration";

  if (configuration.databaseConfigured) {
    try {
      await getDatabase().execute(sql`select 1`);
      database = "connected";
    } catch {
      database = "unreachable";
    }
  }

  return NextResponse.json({
    database,
    llm: configuration.llmConfigured ? "configured" : "needs_configuration",
    langfuse: configuration.langfuseConfigured
      ? "configured"
      : "needs_configuration",
  });
}
