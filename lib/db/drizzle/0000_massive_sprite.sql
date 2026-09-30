-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "constants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"value" text NOT NULL,
	"units" text NOT NULL,
	"description" text NOT NULL,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" serial PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"question" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"hint" text,
	"solution" text,
	"answer" text
);
--> statement-breakpoint
CREATE TABLE "glossary" (
	"id" serial PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_type" text NOT NULL,
	"item_id" integer NOT NULL,
	"item_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "formulas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"latex" text NOT NULL,
	"description" text NOT NULL,
	"variables" text DEFAULT '' NOT NULL,
	"si_units" text,
	"example" text,
	"related_formulas" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"calculator" text,
	"related_constants" text,
	"related_glossary" text,
	"derivation" text,
	"problems" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" varchar DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"user_id" varchar,
	"user_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"feature" text,
	"owner_reply" text,
	"owner_replied_at" timestamp with time zone,
	"user_view_count" integer DEFAULT 0 NOT NULL,
	"user_dismissed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"formula_id" integer NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" text NOT NULL,
	"target_user_id" varchar,
	"target_formula_id" integer,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"scope" text DEFAULT 'all' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"icon" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"user_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"banned_by" varchar NOT NULL,
	"banned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_permanent" boolean DEFAULT false NOT NULL,
	"unbanned_at" timestamp with time zone,
	"unbanned_by" varchar,
	CONSTRAINT "user_bans_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"country" text,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "achievement_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"user_id" varchar NOT NULL,
	"achievement_key" varchar(64) NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_key_pk" PRIMARY KEY("user_id","achievement_key")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_formula" ON "formula_views" USING btree ("user_id" int4_ops,"formula_id" int4_ops);
*/