CREATE TABLE `crm_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`source` text,
	`service` text,
	`owner` text,
	`stage` text DEFAULT 'new' NOT NULL,
	`next_action` text,
	`next_action_at` text,
	`value` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`generic_name` text,
	`category` text,
	`stock` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 5 NOT NULL,
	`unit` text DEFAULT 'عدد' NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`batch` text,
	`expires_at` text,
	`supplier` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`national_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`birth_date` text,
	`gender` text,
	`city` text,
	`service` text,
	`doctor` text,
	`status` text DEFAULT 'active' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_national_id_unique` ON `patients` (`national_id`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`national_id` text NOT NULL,
	`colleague_name` text NOT NULL,
	`service` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`share_amount` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`personnel_type` text NOT NULL,
	`role` text NOT NULL,
	`specialty` text,
	`phone` text,
	`shift` text,
	`status` text DEFAULT 'active' NOT NULL,
	`revenue_share` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
