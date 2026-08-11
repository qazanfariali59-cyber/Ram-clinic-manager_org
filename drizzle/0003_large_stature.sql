CREATE TABLE `collaborator_service_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`service_id` text NOT NULL,
	`share_type` text DEFAULT 'percentage' NOT NULL,
	`share_value` real DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collaborator_service_share_unique` ON `collaborator_service_shares` (`staff_id`,`service_id`);--> statement-breakpoint
CREATE TABLE `medical_services` (
	`id` text PRIMARY KEY NOT NULL,
	`national_code` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`feature` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`tariff_type` text DEFAULT 'standard' NOT NULL,
	`total_value` real DEFAULT 0 NOT NULL,
	`professional_value` real DEFAULT 0 NOT NULL,
	`technical_value` real DEFAULT 0 NOT NULL,
	`anesthesia_value` text DEFAULT '0' NOT NULL,
	`custom_tariff_rials` integer,
	`source_year` integer DEFAULT 1405 NOT NULL,
	`source_title` text NOT NULL,
	`source_url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medical_services_national_code_unique` ON `medical_services` (`national_code`);--> statement-breakpoint
CREATE TABLE `tariff_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`standard_professional_k` integer NOT NULL,
	`standard_technical_k` integer NOT NULL,
	`outpatient_professional_k` integer NOT NULL,
	`outpatient_technical_k` integer NOT NULL,
	`sector` text DEFAULT 'private' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tariff_settings_year_unique` ON `tariff_settings` (`year`);--> statement-breakpoint
ALTER TABLE `referrals` ADD `service_id` text;--> statement-breakpoint
ALTER TABLE `referrals` ADD `tariff_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `referrals` ADD `share_type` text DEFAULT 'percentage' NOT NULL;--> statement-breakpoint
ALTER TABLE `referrals` ADD `share_value` real DEFAULT 0 NOT NULL;