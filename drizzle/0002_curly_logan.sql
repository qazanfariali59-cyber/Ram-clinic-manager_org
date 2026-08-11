CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text,
	`patient_name` text NOT NULL,
	`national_id` text,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`doctor` text NOT NULL,
	`service` text NOT NULL,
	`room` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clinical_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`appointment_id` text,
	`doctor` text NOT NULL,
	`chief_complaint` text,
	`diagnosis` text,
	`treatment` text,
	`medications` text,
	`follow_up_at` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `financial_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text,
	`counterparty` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_method` text,
	`status` text DEFAULT 'paid' NOT NULL,
	`reference_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
