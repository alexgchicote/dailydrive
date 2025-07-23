CREATE TABLE "actions_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'predefined' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid,
	CONSTRAINT "actions_categories_category_type_check" CHECK (type IN ('predefined', 'custom')),
	CONSTRAINT "actions_categories_custom_must_have_creator_check" CHECK ((type <> 'custom') OR (created_by_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "actions_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"intent" text NOT NULL,
	"type" text DEFAULT 'predefined' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid,
	CONSTRAINT "actions_list_intent_check" CHECK (intent IN ('engage', 'avoid')),
	CONSTRAINT "actions_list_action_type_check" CHECK (type IN ('predefined', 'custom')),
	CONSTRAINT "actions_list_custom_must_have_creator_check" CHECK ((type <> 'custom') OR (created_by_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "daily_actions_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"selected_action_id" integer NOT NULL,
	"user_day_id" integer,
	"log_date" date NOT NULL,
	"outcome" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_actions_log_outcome_check" CHECK (outcome IN ('positive', 'negative', 'neutral'))
);
--> statement-breakpoint
CREATE TABLE "selected_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"action_id" integer NOT NULL,
	"added_to_tracking_at" date NOT NULL,
	"removed_from_tracking_at" date,
	"group_category" boolean DEFAULT false,
	CONSTRAINT "selected_actions_check" CHECK ((removed_from_tracking_at IS NULL) OR (removed_from_tracking_at >= added_to_tracking_at))
);
--> statement-breakpoint
CREATE TABLE "user_daily_journals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"content" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_daily_journals_user_id_log_date_unique" UNIQUE("user_id","log_date")
);
--> statement-breakpoint
CREATE TABLE "user_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"actions_day_grade" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"num_engage_actions_total" smallint NOT NULL,
	"num_engage_actions_positive" smallint NOT NULL,
	"num_engage_actions_neutral" smallint NOT NULL,
	"num_avoid_actions_total" smallint NOT NULL,
	"num_avoid_actions_positive" smallint NOT NULL,
	"num_categories_tracked" smallint NOT NULL,
	"num_engage_actions_negative" smallint NOT NULL,
	"num_avoid_actions_negative" smallint NOT NULL,
	CONSTRAINT "user_days_num_avoid_actions_total_check" CHECK (num_avoid_actions_total >= 0),
	CONSTRAINT "user_days_num_categories_tracked_check" CHECK (num_categories_tracked >= 0),
	CONSTRAINT "user_days_num_engage_actions_negative_check" CHECK (num_engage_actions_negative >= 0),
	CONSTRAINT "user_days_num_avoid_actions_negative_check" CHECK (num_avoid_actions_negative >= 0),
	CONSTRAINT "user_days_num_engage_actions_positive_check" CHECK (num_engage_actions_positive >= 0),
	CONSTRAINT "user_days_num_engage_actions_total_check" CHECK (num_engage_actions_total >= 0),
	CONSTRAINT "user_days_num_engage_actions_neutral_check" CHECK (num_engage_actions_neutral >= 0),
	CONSTRAINT "user_days_num_avoid_actions_positive_check" CHECK (num_avoid_actions_positive >= 0)
);
--> statement-breakpoint
ALTER TABLE "actions_categories" ADD CONSTRAINT "actions_categories_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "actions_list" ADD CONSTRAINT "actions_list_category_id_actions_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."actions_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions_list" ADD CONSTRAINT "actions_list_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_actions_log" ADD CONSTRAINT "daily_actions_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_actions_log" ADD CONSTRAINT "daily_actions_log_selected_action_id_selected_actions_id_fk" FOREIGN KEY ("selected_action_id") REFERENCES "public"."selected_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_actions_log" ADD CONSTRAINT "daily_actions_log_user_day_id_user_days_id_fk" FOREIGN KEY ("user_day_id") REFERENCES "public"."user_days"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selected_actions" ADD CONSTRAINT "selected_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "selected_actions" ADD CONSTRAINT "selected_actions_action_id_actions_list_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_journals" ADD CONSTRAINT "user_daily_journals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_days" ADD CONSTRAINT "user_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_predefined_categories_unique_name" ON "actions_categories" USING btree ("name") WHERE type = 'predefined';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_custom_categories_unique_per_user" ON "actions_categories" USING btree ("created_by_id","name") WHERE type = 'custom';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_predefined_actions_unique_name" ON "actions_list" USING btree ("name") WHERE type = 'predefined';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_custom_actions_unique_per_user" ON "actions_list" USING btree ("created_by_id","name") WHERE type = 'custom';--> statement-breakpoint
CREATE UNIQUE INDEX "daily_actions_log_unique_valid_entry" ON "daily_actions_log" USING btree ("user_id","selected_action_id","log_date");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_selected_action" ON "selected_actions" USING btree ("user_id","action_id") WHERE removed_from_tracking_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_user_daily_journals_user_id_log_date" ON "user_daily_journals" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_days_unique_valid_entry" ON "user_days" USING btree ("user_id","log_date");