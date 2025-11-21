ALTER TABLE `users` ADD `is_approved` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `auth_user_id` text;