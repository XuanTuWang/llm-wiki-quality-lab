import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { sourceChunks, sources, sourceVersions, workspaces } from "@/db/schema";
import { chunkText, normalizeSourceText, sha256 } from "@/lib/ingestion";

export const runtime = "nodejs";

type CreateSourceRequest = {
  body?: unknown;
  title?: unknown;
};

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreateSourceRequest;
    const body = typeof input.body === "string" ? normalizeSourceText(input.body) : "";

    if (!body) {
      return NextResponse.json({ error: "资料正文不能为空。" }, { status: 400 });
    }

    const title = typeof input.title === "string" && input.title.trim()
      ? input.title.trim().slice(0, 240)
      : body.split("\n").find(Boolean)?.slice(0, 72) ?? "未命名资料";
    const db = getDatabase();
    const workspace = await getOrCreateWorkspace();
    const [source] = await db
      .insert(sources)
      .values({ workspaceId: workspace.id, title, status: "processed" })
      .returning();
    const [version] = await db
      .insert(sourceVersions)
      .values({
        sourceId: source.id,
        version: 1,
        body,
        sha256: await sha256(body),
      })
      .returning();
    const chunks = chunkText(body);

    if (chunks.length > 0) {
      await db.insert(sourceChunks).values(
        chunks.map((chunk) => ({
          sourceVersionId: version.id,
          ordinal: chunk.ordinal,
          body: chunk.body,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        })),
      );
    }

    return NextResponse.json({
      source: {
        id: source.id,
        title: source.title,
        version: version.version,
        chunks: chunks.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "资料暂时无法保存，请检查数据库连接后重试。" },
      { status: 500 },
    );
  }
}

async function getOrCreateWorkspace() {
  const db = getDatabase();
  const [existing] = await db.select().from(workspaces).limit(1);

  if (existing) {
    return existing;
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "证据优先知识库",
      topic: "可审核、可追溯的个人知识库",
      answerRules: "只使用已批准的知识和明确来源回答。",
    })
    .returning();

  return workspace;
}
