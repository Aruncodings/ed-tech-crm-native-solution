ALTER TABLE `users` ADD `must_change_password` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_password_change` text;