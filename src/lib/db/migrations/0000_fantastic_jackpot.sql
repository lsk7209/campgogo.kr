CREATE TABLE `ai_budget` (
	`date` text PRIMARY KEY NOT NULL,
	`total_cost_usd` real DEFAULT 0,
	`call_count` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `ai_cache` (
	`input_hash` text PRIMARY KEY NOT NULL,
	`prompt_version` text NOT NULL,
	`output` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`cost_usd` real,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`body_markdown` text,
	`meta_description` text,
	`hero_image` text,
	`faqs` text,
	`internal_links` text,
	`external_sources` text,
	`primary_keyword` text,
	`secondary_keywords` text,
	`persona` text,
	`pattern` text,
	`has_affiliate_links` integer DEFAULT false,
	`word_count` integer,
	`gate_passed` integer DEFAULT false,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`date_published` text,
	`date_modified` text,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `blog_category_idx` ON `blog_posts` (`category`);--> statement-breakpoint
CREATE INDEX `blog_status_idx` ON `blog_posts` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `campsites` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text,
	`name` text NOT NULL,
	`name_normalized` text,
	`sido` text NOT NULL,
	`gungu` text,
	`address` text,
	`lat` real,
	`lng` real,
	`type` text,
	`operator` text,
	`operator_type` text,
	`price_1night` integer,
	`facilities` text,
	`photos` text,
	`contact` text,
	`reservation_url` text,
	`raw_data` text,
	`is_public` integer DEFAULT false,
	`is_free` integer DEFAULT false,
	`is_cheap` integer DEFAULT false,
	`is_chabak` integer DEFAULT false,
	`chabak_trust_level` text,
	`chabak_source` text,
	`chabak_source_date` text,
	`fit_score` integer DEFAULT 0,
	`unique_points` text,
	`distance_from_cities` text,
	`nearby_tour_spots` text,
	`region_avg_comparison` text,
	`safety_score` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `campsites_sido_idx` ON `campsites` (`sido`);--> statement-breakpoint
CREATE INDEX `campsites_gungu_idx` ON `campsites` (`sido`,`gungu`);--> statement-breakpoint
CREATE INDEX `campsites_fitscore_idx` ON `campsites` (`fit_score`);--> statement-breakpoint
CREATE INDEX `campsites_public_idx` ON `campsites` (`is_public`);--> statement-breakpoint
CREATE INDEX `campsites_chabak_idx` ON `campsites` (`is_chabak`);--> statement-breakpoint
CREATE INDEX `campsites_namenorm_idx` ON `campsites` (`name_normalized`);--> statement-breakpoint
CREATE TABLE `collect_checkpoints` (
	`job_name` text PRIMARY KEY NOT NULL,
	`last_cursor` text,
	`processed` integer DEFAULT 0,
	`total` integer,
	`status` text,
	`error_message` text,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `cosine_calibration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sample_size` integer,
	`mean_similarity` real,
	`stddev` real,
	`recommended_threshold` real,
	`notes` text,
	`calibrated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`license` text,
	`last_fetched_at` integer,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `dedup_review` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`candidate_a_id` text NOT NULL,
	`candidate_b_id` text NOT NULL,
	`similarity` real NOT NULL,
	`status` text DEFAULT 'pending',
	`resolved_at` integer,
	`resolved_by` text,
	FOREIGN KEY (`candidate_a_id`) REFERENCES `campsites`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_b_id`) REFERENCES `campsites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'subscribed',
	`marketing_consent` integer DEFAULT false,
	`consented_at` integer,
	`unsubscribed_at` integer,
	`subscribed_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`url` text NOT NULL,
	`campsite_id` text,
	`theme` text,
	`sido` text,
	`gungu` text,
	`season` text,
	`title` text NOT NULL,
	`meta_description` text,
	`commentary` text,
	`faqs` text,
	`active_sections` text,
	`internal_links` text,
	`quality_score` real DEFAULT 0,
	`gate_passed` integer DEFAULT false,
	`gate_results` text,
	`cosine_similarity` real,
	`unique_points_count` integer DEFAULT 0,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`date_published` text,
	`date_modified` text,
	`last_reviewed_at` integer,
	`persona` text,
	`author_label` text,
	`revalidate_seconds` integer DEFAULT 604800,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`campsite_id`) REFERENCES `campsites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_url_idx` ON `pages` (`url`);--> statement-breakpoint
CREATE INDEX `pages_type_status_idx` ON `pages` (`type`,`status`);--> statement-breakpoint
CREATE INDEX `pages_theme_region_idx` ON `pages` (`theme`,`sido`);--> statement-breakpoint
CREATE INDEX `pages_published_idx` ON `pages` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`tone_guide` text,
	`system_prompt` text,
	`few_shot_examples` text
);
--> statement-breakpoint
CREATE TABLE `publish_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text,
	`at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campsite_id` text,
	`report_type` text,
	`content` text NOT NULL,
	`reporter_email` text,
	`status` text DEFAULT 'pending',
	`reviewed_at` integer,
	`reviewer_note` text,
	`submitted_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`campsite_id`) REFERENCES `campsites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weather_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text,
	`cached_at` integer DEFAULT (unixepoch())
);
