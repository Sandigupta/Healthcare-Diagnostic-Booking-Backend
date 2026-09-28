CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "diagnostic_centres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "diagnostic_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "centre_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"centre_id" integer NOT NULL,
	"test_id" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"test_id" integer NOT NULL,
	"centre_id" integer NOT NULL,
	"appointment_date_time" timestamp with time zone NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"payment_reference" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(100) NOT NULL,
	"payment_id" varchar(100) NOT NULL,
	"booking_id" integer,
	"status" "payment_status" NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "centre_tests" ADD CONSTRAINT "centre_tests_centre_id_diagnostic_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."diagnostic_centres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centre_tests" ADD CONSTRAINT "centre_tests_test_id_diagnostic_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."diagnostic_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_test_id_diagnostic_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."diagnostic_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_centre_id_diagnostic_centres_id_fk" FOREIGN KEY ("centre_id") REFERENCES "public"."diagnostic_centres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "centre_tests_centre_test_unique" ON "centre_tests" USING btree ("centre_id","test_id");--> statement-breakpoint
CREATE INDEX "centre_tests_centre_id_idx" ON "centre_tests" USING btree ("centre_id");--> statement-breakpoint
CREATE INDEX "centre_tests_test_id_idx" ON "centre_tests" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_payment_reference_unique" ON "payments" USING btree ("payment_reference");--> statement-breakpoint
CREATE INDEX "payments_booking_id_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_event_id_unique" ON "webhook_events" USING btree ("event_id");
