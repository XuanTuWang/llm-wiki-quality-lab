import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

export const privacyMode = pgEnum("privacy_mode", [
  "demo",
  "private",
  "full_trace",
]);
export const sourceStatus = pgEnum("source_status", [
  "draft",
  "analyzing",
  "proposed",
  "processed",
  "failed",
]);
export const proposalStatus = pgEnum("proposal_status", [
  "pending",
  "approved",
  "rejected",
]);
export const wikiStatus = pgEnum("wiki_status", [
  "draft",
  "published",
  "needs_review",
]);
export const answerState = pgEnum("answer_state", [
  "answered",
  "insufficient_evidence",
  "failed",
]);
export const analysisStatus = pgEnum("analysis_status", [
  "queued",
  "running",
  "proposed",
  "failed",
]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  topic: varchar("topic", { length: 240 }).notNull(),
  answerRules: text("answer_rules").notNull().default(""),
  privacyMode: privacyMode("privacy_mode").notNull().default("demo"),
  createdAt,
});

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    sourceUrl: text("source_url"),
    status: sourceStatus("status").notNull().default("draft"),
    createdAt,
  },
  (table) => [index("sources_workspace_idx").on(table.workspaceId)],
);

export const sourceVersions = pgTable(
  "source_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    body: text("body").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    createdAt,
  },
  (table) => [
    index("source_versions_source_idx").on(table.sourceId),
    index("source_versions_hash_idx").on(table.sha256),
  ],
);

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceVersionId: uuid("source_version_id")
      .notNull()
      .references(() => sourceVersions.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    body: text("body").notNull(),
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    createdAt,
  },
  (table) => [index("source_chunks_version_idx").on(table.sourceVersionId)],
);

export const analysisRuns = pgTable(
  "analysis_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceVersionId: uuid("source_version_id")
      .notNull()
      .references(() => sourceVersions.id, { onDelete: "cascade" }),
    status: analysisStatus("status").notNull().default("queued"),
    promptVersion: varchar("prompt_version", { length: 80 }),
    model: varchar("model", { length: 120 }),
    traceId: varchar("trace_id", { length: 120 }),
    errorSummary: text("error_summary"),
    createdAt,
  },
  (table) => [index("analysis_runs_source_version_idx").on(table.sourceVersionId)],
);

export const proposedChanges = pgTable(
  "proposed_changes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisRunId: uuid("analysis_run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 60 }).notNull(),
    payload: jsonb("payload").notNull(),
    evidenceChunkIds: jsonb("evidence_chunk_ids").$type<string[]>().notNull(),
    confidence: integer("confidence"),
    status: proposalStatus("status").notNull().default("pending"),
    reviewerNote: text("reviewer_note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    index("proposed_changes_run_idx").on(table.analysisRunId),
    index("proposed_changes_status_idx").on(table.status),
  ],
);

export const wikiPages = pgTable(
  "wiki_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 180 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    summary: text("summary").notNull().default(""),
    revision: integer("revision").notNull().default(1),
    status: wikiStatus("status").notNull().default("draft"),
    createdAt,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("wiki_pages_workspace_idx").on(table.workspaceId),
    index("wiki_pages_slug_idx").on(table.slug),
  ],
);

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wikiPageId: uuid("wiki_page_id")
      .notNull()
      .references(() => wikiPages.id, { onDelete: "cascade" }),
    sourceProposalId: uuid("source_proposal_id").references(
      () => proposedChanges.id,
      { onDelete: "set null" },
    ),
    text: text("text").notNull(),
    status: wikiStatus("status").notNull().default("draft"),
    createdAt,
  },
  (table) => [index("claims_page_idx").on(table.wikiPageId)],
);

export const citations = pgTable(
  "citations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    claimId: uuid("claim_id").references(() => claims.id, {
      onDelete: "cascade",
    }),
    answerRunId: uuid("answer_run_id").references(() => answerRuns.id, {
      onDelete: "cascade",
    }),
    sourceChunkId: uuid("source_chunk_id")
      .notNull()
      .references(() => sourceChunks.id, { onDelete: "restrict" }),
    excerpt: text("excerpt").notNull(),
    createdAt,
  },
  (table) => [
    index("citations_claim_idx").on(table.claimId),
    index("citations_chunk_idx").on(table.sourceChunkId),
  ],
);

export const answerRuns = pgTable(
  "answer_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer"),
    state: answerState("state").notNull(),
    promptVersion: varchar("prompt_version", { length: 80 }),
    traceId: varchar("trace_id", { length: 120 }),
    createdAt,
  },
  (table) => [index("answer_runs_workspace_idx").on(table.workspaceId)],
);

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  answerRunId: uuid("answer_run_id")
    .notNull()
    .references(() => answerRuns.id, { onDelete: "cascade" }),
  rating: varchar("rating", { length: 20 }).notNull(),
  comment: text("comment"),
  createdAt,
});

export const evalCases = pgTable("eval_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  expectedBehavior: varchar("expected_behavior", { length: 60 }).notNull(),
  version: integer("version").notNull().default(1),
  createdAt,
});
