CREATE TABLE `call_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`caller_id` integer NOT NULL,
	`call_type` text NOT NULL,
	`call_status` text NOT NULL,
	`call_duration` integer,
	`notes` text,
	`next_followup_date` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`caller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `counselor_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`counselor_id` integer NOT NULL,
	`note_type` text NOT NULL,
	`notes` text NOT NULL,
	`is_important` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`counselor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`duration` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_name_unique` ON `courses` (`name`);--> statement-breakpoint
CREATE TABLE `custom_fields` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`field_name` text NOT NULL,
	`field_type` text NOT NULL,
	`field_label` text NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`dropdown_options` text,
	`display_order` integer DEFAULT 0,
	`applies_to` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dropdown_master` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dropdown_name` text NOT NULL,
	`dropdown_values` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `export_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`requested_by` integer,
	`export_type` text NOT NULL,
	`filters` text,
	`file_path` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uploaded_by` integer,
	`file_name` text,
	`total_records` integer DEFAULT 0,
	`successful_imports` integer DEFAULT 0,
	`failed_imports` integer DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_log` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`course_interest` text,
	`lead_source` text NOT NULL,
	`lead_status` text DEFAULT 'new' NOT NULL,
	`assigned_to` integer,
	`lead_score` integer DEFAULT 0,
	`next_followup_date` text,
	`last_contact_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schema_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version_number` integer NOT NULL,
	`changes_description` text,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`phone` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);