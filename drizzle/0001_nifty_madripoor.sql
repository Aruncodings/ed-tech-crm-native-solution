CREATE TABLE `call_logs_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`caller_id` integer NOT NULL,
	`call_date` text NOT NULL,
	`call_duration_seconds` integer,
	`call_outcome` text NOT NULL,
	`next_followup_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads_new`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`caller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `counselor_notes_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`counselor_id` integer NOT NULL,
	`note_type` text NOT NULL,
	`content` text NOT NULL,
	`is_important` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads_new`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`counselor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`duration_months` integer,
	`fee_amount` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_new_code_unique` ON `courses_new` (`code`);--> statement-breakpoint
CREATE TABLE `custom_fields_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`field_name` text NOT NULL,
	`field_label` text NOT NULL,
	`field_type` text NOT NULL,
	`entity_type` text NOT NULL,
	`is_required` integer DEFAULT false NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0,
	`validation_rules` text,
	`dropdown_options` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dropdown_master_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `export_jobs_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exported_by_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`filters` text,
	`file_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`exported_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `import_jobs_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`imported_by_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`total_records` integer DEFAULT 0,
	`success_count` integer DEFAULT 0,
	`error_count` integer DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`error_log` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`imported_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`whatsapp_number` text,
	`lead_source` text NOT NULL,
	`lead_stage` text DEFAULT 'new' NOT NULL,
	`lead_status` text DEFAULT 'active' NOT NULL,
	`course_interest_id` integer,
	`assigned_telecaller_id` integer,
	`assigned_counselor_id` integer,
	`city` text,
	`state` text,
	`country` text,
	`education_level` text,
	`current_occupation` text,
	`conversion_date` text,
	`lost_reason` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`course_interest_id`) REFERENCES `courses_new`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_telecaller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_counselor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
