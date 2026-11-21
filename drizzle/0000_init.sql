CREATE TYPE "public"."property_deal" AS ENUM('rental', 'sale');--> statement-breakpoint
CREATE TYPE "public"."property_kind" AS ENUM('apartment', 'studio', 'kitnet', 'house');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('published', 'draft', 'paused');--> statement-breakpoint
CREATE TABLE "changelog" (
	"tag_name" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "changelog" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"phone" text,
	"creci" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"status" "property_status" DEFAULT 'draft' NOT NULL,
	"kind" "property_kind" NOT NULL,
	"deal" "property_deal" NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"postal_code" text NOT NULL,
	"street" text DEFAULT '' NOT NULL,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"price" bigint NOT NULL,
	"condo" integer DEFAULT 0 NOT NULL,
	"iptu" integer DEFAULT 0 NOT NULL,
	"area" integer NOT NULL,
	"rooms" integer NOT NULL,
	"suites" integer DEFAULT 0 NOT NULL,
	"parking" integer DEFAULT 0 NOT NULL,
	"floor" integer,
	"pet_friendly" boolean DEFAULT false NOT NULL,
	"furnished" boolean DEFAULT false NOT NULL,
	"transit_distance_min" integer DEFAULT 0 NOT NULL,
	"transit_label" text DEFAULT '' NOT NULL,
	"built_year" integer NOT NULL,
	"description" text[] NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug"),
	CONSTRAINT "properties_price_positive" CHECK ("properties"."price" > 0),
	CONSTRAINT "properties_area_positive" CHECK ("properties"."area" > 0),
	CONSTRAINT "properties_non_negative_counts" CHECK ("properties"."condo" >= 0 AND "properties"."iptu" >= 0 AND "properties"."rooms" >= 0 AND "properties"."suites" >= 0 AND "properties"."parking" >= 0 AND "properties"."transit_distance_min" >= 0 AND ("properties"."floor" IS NULL OR "properties"."floor" >= 0)),
	CONSTRAINT "properties_built_year_range" CHECK ("properties"."built_year" BETWEEN 1900 AND 2100),
	CONSTRAINT "properties_postal_code_format" CHECK ("properties"."postal_code" ~ '^[0-9]{8}$'),
	CONSTRAINT "properties_state_uf" CHECK (char_length("properties"."state") = 2),
	CONSTRAINT "properties_coords_pair" CHECK (("properties"."lat" IS NULL) = ("properties"."lng" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner_id");