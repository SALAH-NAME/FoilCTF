-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"password" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"banned_until" timestamp,
	"profile_id" integer,
	"email" text,
	"username" text,
	"avatar" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expiry" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctfs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_members_min" integer DEFAULT 1 NOT NULL,
	"team_members_max" integer,
	"metadata" json,
	CONSTRAINT "constraint_members_min_gt_zero" CHECK (team_members_min > 0),
	CONSTRAINT "constraint_members_min_lteq_max" CHECK (team_members_min <= team_members_max)
);
--> statement-breakpoint
CREATE TABLE "ctf_organizers" (
	"ctf_id" integer NOT NULL,
	"organizer_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" integer
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contents" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"name" text DEFAULT 'Unnamed challenge' NOT NULL,
	"description" text DEFAULT 'No description' NOT NULL,
	"reward" integer DEFAULT 500 NOT NULL,
	"reward_min" integer DEFAULT 350 NOT NULL,
	"reward_first_blood" integer DEFAULT 0 NOT NULL,
	"reward_decrements" boolean DEFAULT true NOT NULL,
	"author_id" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "constraint_reward" CHECK (reward >= reward_min),
	CONSTRAINT "constraint_reward_min" CHECK (reward_min >= 0)
);
--> statement-breakpoint
CREATE TABLE "hints" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"penalty" integer DEFAULT 0 NOT NULL,
	"contents" text DEFAULT 'Empty hint' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"id" serial PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"team_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"last_attempt_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"contents" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"contents" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"issuer_id" varchar(64) DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" integer NOT NULL,
	"member_id" varchar(64) NOT NULL,
	CONSTRAINT "team_members_pkey" PRIMARY KEY("team_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "challenges_attachments" (
	"challenge_id" integer NOT NULL,
	"attachment_id" integer NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "challenges_attachments_pkey" PRIMARY KEY("challenge_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "notification_users" (
	"notification_id" integer NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"read_at" timestamp,
	CONSTRAINT "notification_users_pkey" PRIMARY KEY("user_id","notification_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial NOT NULL,
	"chatroom_id" integer NOT NULL,
	"contents" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	"deleted_at" timestamp,
	"writer_id" varchar(64),
	CONSTRAINT "messages_pkey" PRIMARY KEY("id","chatroom_id")
);
--> statement-breakpoint
CREATE TABLE "ctfs_challenges" (
	"ctf_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"reward" integer DEFAULT 500 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"solves" integer DEFAULT 0 NOT NULL,
	"first_blood_at" timestamp,
	"first_blood_id" integer,
	"container_limits" json,
	"flag" json NOT NULL,
	CONSTRAINT "ctfs_challenges_pkey" PRIMARY KEY("ctf_id","challenge_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "profile" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_organizers" ADD CONSTRAINT "constraint_ctf" FOREIGN KEY ("ctf_id") REFERENCES "public"."ctfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_organizers" ADD CONSTRAINT "constraint_organizer" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "constraint_profile" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "constraint_author" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hints" ADD CONSTRAINT "constraint_challenge" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "constraint_team" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "constraint_challenge" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "constraint_issuer" FOREIGN KEY ("issuer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "constraint_team" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "constraint_member" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges_attachments" ADD CONSTRAINT "constraint_challenge" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges_attachments" ADD CONSTRAINT "constraint_attachment" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_users" ADD CONSTRAINT "constraint_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_users" ADD CONSTRAINT "constraint_notification" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "constraint_writer" FOREIGN KEY ("writer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "constraint_chatroom" FOREIGN KEY ("chatroom_id") REFERENCES "public"."ctfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctfs_challenges" ADD CONSTRAINT "constraint_ctf" FOREIGN KEY ("ctf_id") REFERENCES "public"."ctfs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctfs_challenges" ADD CONSTRAINT "constraint_challenge" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctfs_challenges" ADD CONSTRAINT "constraint_first_blood" FOREIGN KEY ("first_blood_id") REFERENCES "public"."participations"("id") ON DELETE no action ON UPDATE no action;
*/