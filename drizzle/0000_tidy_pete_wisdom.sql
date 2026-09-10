CREATE TYPE "public"."analysis_status" AS ENUM('queued', 'running', 'proposed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."answer_state" AS ENUM('answered', 'insufficient_evidence', 'failed');--> statement-breakpoint
CREATE TYPE "public"."privacy_mode" AS ENUM('demo', 'private', 'full_trace');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('draft', 'analyzing', 'proposed', 'processed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."wiki_status" AS ENUM('draft', 'published', 'needs_review');--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_version_id" uuid NOT NULL,
	"status" "analysis_status" DEFAULT 'queued' NOT NULL,
	"prompt_version" varchar(80),
	"model" varchar(120),
	"trace_id" varchar(120),
	"error_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "answer_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"state" "answer_state" NOT NULL,
	"prompt_version" varchar(80),
	"trace_id" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid,
	"answer_run_id" uuid,
	"source_chunk_id" uuid NOT NULL,
	"excerpt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wiki_page_id" uuid NOT NULL,
	"source_proposal_id" uuid,
	"text" text NOT NULL,
	"status" "wiki_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"input" text NOT NULL,
	"expected_behavior" varchar(60) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"answer_run_id" uuid NOT NULL,
	"rating" varchar(20) NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposed_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"type" varchar(60) NOT NULL,
	"payload" jsonb NOT NULL,
	"evidence_chunk_ids" jsonb NOT NULL,
	"confidence" integer,
	"status" "proposal_status" DEFAULT 'pending' NOT NULL,
	"reviewer_note" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_version_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"body" text NOT NULL,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"body" text NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(240) NOT NULL,
	"source_url" text,
	"status" "source_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(240) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"status" "wiki_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"topic" varchar(240) NOT NULL,
	"answer_rules" text DEFAULT '' NOT NULL,
	"privacy_mode" "privacy_mode" DEFAULT 'demo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_source_version_id_source_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."source_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_runs" ADD CONSTRAINT "answer_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_answer_run_id_answer_runs_id_fk" FOREIGN KEY ("answer_run_id") REFERENCES "public"."answer_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_source_chunk_id_source_chunks_id_fk" FOREIGN KEY ("source_chunk_id") REFERENCES "public"."source_chunks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_wiki_page_id_wiki_pages_id_fk" FOREIGN KEY ("wiki_page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_source_proposal_id_proposed_changes_id_fk" FOREIGN KEY ("source_proposal_id") REFERENCES "public"."proposed_changes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_cases" ADD CONSTRAINT "eval_cases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_answer_run_id_answer_runs_id_fk" FOREIGN KEY ("answer_run_id") REFERENCES "public"."answer_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposed_changes" ADD CONSTRAINT "proposed_changes_analysis_run_id_analysis_runs_id_fk" FOREIGN KEY ("analysis_run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_chunks" ADD CONSTRAINT "source_chunks_source_version_id_source_versions_id_fk" FOREIGN KEY ("source_version_id") REFERENCES "public"."source_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_runs_source_version_idx" ON "analysis_runs" USING btree ("source_version_id");--> statement-breakpoint
CREATE INDEX "answer_runs_workspace_idx" ON "answer_runs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "citations_claim_idx" ON "citations" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "citations_chunk_idx" ON "citations" USING btree ("source_chunk_id");--> statement-breakpoint
CREATE INDEX "claims_page_idx" ON "claims" USING btree ("wiki_page_id");--> statement-breakpoint
CREATE INDEX "proposed_changes_run_idx" ON "proposed_changes" USING btree ("analysis_run_id");--> statement-breakpoint
CREATE INDEX "proposed_changes_status_idx" ON "proposed_changes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "source_chunks_version_idx" ON "source_chunks" USING btree ("source_version_id");--> statement-breakpoint
CREATE INDEX "source_versions_source_idx" ON "source_versions" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "source_versions_hash_idx" ON "source_versions" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "sources_workspace_idx" ON "sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "wiki_pages_workspace_idx" ON "wiki_pages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "wiki_pages_slug_idx" ON "wiki_pages" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "source_chunks_fts_idx" ON "source_chunks" USING gin (to_tsvector('simple', "body"));
