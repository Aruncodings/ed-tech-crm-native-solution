CREATE TABLE `telecaller_call_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telecaller_id` integer NOT NULL,
	`date` text NOT NULL,
	`calls_made` integer DEFAULT 0 NOT NULL,
	`calls_answered` integer DEFAULT 0 NOT NULL,
	`total_duration_seconds` integer DEFAULT 0 NOT NULL,
	`leads_contacted` integer DEFAULT 0 NOT NULL,
	`leads_converted` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`telecaller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` ADD `daily_call_limit` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `monthly_call_limit` integer DEFAULT 0 NOT NULL;