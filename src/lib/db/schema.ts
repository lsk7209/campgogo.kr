import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. data_sources
export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url"),
  license: text("license"),
  lastFetchedAt: integer("last_fetched_at", { mode: "timestamp" }),
  notes: text("notes"),
});

// 2. campsites
export const campsites = sqliteTable(
  "campsites",
  {
    id: text("id").primaryKey(),
    sourceId: text("source_id")
      .notNull()
      .references(() => dataSources.id),
    externalId: text("external_id"),
    name: text("name").notNull(),
    nameNormalized: text("name_normalized"),
    sido: text("sido").notNull(),
    gungu: text("gungu"),
    address: text("address"),
    lat: real("lat"),
    lng: real("lng"),
    type: text("type"),
    operator: text("operator"),
    operatorType: text("operator_type"),
    price1Night: integer("price_1night"),
    facilities: text("facilities", { mode: "json" }),
    photos: text("photos", { mode: "json" }),
    contact: text("contact"),
    reservationUrl: text("reservation_url"),
    rawData: text("raw_data", { mode: "json" }),
    isPublic: integer("is_public", { mode: "boolean" }).default(false),
    isFree: integer("is_free", { mode: "boolean" }).default(false),
    isCheap: integer("is_cheap", { mode: "boolean" }).default(false),
    isChabak: integer("is_chabak", { mode: "boolean" }).default(false),
    chabakTrustLevel: text("chabak_trust_level"),
    chabakSource: text("chabak_source"),
    chabakSourceDate: text("chabak_source_date"),
    fitScore: integer("fit_score").default(0),
    uniquePoints: text("unique_points", { mode: "json" }),
    distanceFromCities: text("distance_from_cities", { mode: "json" }),
    nearbyTourSpots: text("nearby_tour_spots", { mode: "json" }),
    regionAvgComparison: text("region_avg_comparison", { mode: "json" }),
    safetyScore: integer("safety_score"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
  },
  (t) => ({
    sidoIdx: index("campsites_sido_idx").on(t.sido),
    gunguIdx: index("campsites_gungu_idx").on(t.sido, t.gungu),
    fitScoreIdx: index("campsites_fitscore_idx").on(t.fitScore),
    isPublicIdx: index("campsites_public_idx").on(t.isPublic),
    isChabakIdx: index("campsites_chabak_idx").on(t.isChabak),
    nameNormIdx: index("campsites_namenorm_idx").on(t.nameNormalized),
  })
);

// 3. dedup_review
export const dedupReview = sqliteTable("dedup_review", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  candidateAId: text("candidate_a_id")
    .notNull()
    .references(() => campsites.id),
  candidateBId: text("candidate_b_id")
    .notNull()
    .references(() => campsites.id),
  similarity: real("similarity").notNull(),
  status: text("status").default("pending"),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolvedBy: text("resolved_by"),
});

// 4. pages
export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    slug: text("slug").notNull(),
    url: text("url").notNull(),
    campsiteId: text("campsite_id").references(() => campsites.id),
    theme: text("theme"),
    sido: text("sido"),
    gungu: text("gungu"),
    season: text("season"),
    title: text("title").notNull(),
    metaDescription: text("meta_description"),
    commentary: text("commentary"),
    faqs: text("faqs", { mode: "json" }),
    activeSections: text("active_sections", { mode: "json" }),
    internalLinks: text("internal_links", { mode: "json" }),
    qualityScore: real("quality_score").default(0),
    gatePassed: integer("gate_passed", { mode: "boolean" }).default(false),
    gateResults: text("gate_results", { mode: "json" }),
    cosineSimilarity: real("cosine_similarity"),
    uniquePointsCount: integer("unique_points_count").default(0),
    status: text("status").notNull().default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    datePublished: text("date_published"),
    dateModified: text("date_modified"),
    lastReviewedAt: integer("last_reviewed_at", { mode: "timestamp" }),
    persona: text("persona"),
    authorLabel: text("author_label"),
    revalidateSeconds: integer("revalidate_seconds").default(604800),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
  },
  (t) => ({
    urlIdx: uniqueIndex("pages_url_idx").on(t.url),
    typeStatusIdx: index("pages_type_status_idx").on(t.type, t.status),
    themeRegionIdx: index("pages_theme_region_idx").on(t.theme, t.sido),
    publishedIdx: index("pages_published_idx").on(t.status, t.publishedAt),
  })
);

// 5. blog_posts
export const blogPosts = sqliteTable(
  "blog_posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    tags: text("tags", { mode: "json" }),
    bodyMarkdown: text("body_markdown"),
    metaDescription: text("meta_description"),
    heroImage: text("hero_image"),
    faqs: text("faqs", { mode: "json" }),
    internalLinks: text("internal_links", { mode: "json" }),
    externalSources: text("external_sources", { mode: "json" }),
    primaryKeyword: text("primary_keyword"),
    secondaryKeywords: text("secondary_keywords", { mode: "json" }),
    persona: text("persona"),
    pattern: text("pattern"),
    hasAffiliateLinks: integer("has_affiliate_links", { mode: "boolean" }).default(false),
    wordCount: integer("word_count"),
    gatePassed: integer("gate_passed", { mode: "boolean" }).default(false),
    status: text("status").notNull().default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    datePublished: text("date_published"),
    dateModified: text("date_modified"),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
      sql`(unixepoch())`
    ),
  },
  (t) => ({
    categoryIdx: index("blog_category_idx").on(t.category),
    statusIdx: index("blog_status_idx").on(t.status, t.publishedAt),
  })
);

// 6. personas
export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  toneGuide: text("tone_guide"),
  systemPrompt: text("system_prompt"),
  fewShotExamples: text("few_shot_examples", { mode: "json" }),
});

// 7. ai_cache
export const aiCache = sqliteTable("ai_cache", {
  inputHash: text("input_hash").primaryKey(),
  promptVersion: text("prompt_version").notNull(),
  output: text("output").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  costUsd: real("cost_usd"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

// 8. ai_budget
export const aiBudget = sqliteTable("ai_budget", {
  date: text("date").primaryKey(),
  totalCostUsd: real("total_cost_usd").default(0),
  callCount: integer("call_count").default(0),
});

// 9. publish_log
export const publishLog = sqliteTable("publish_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id),
  action: text("action").notNull(),
  reason: text("reason"),
  at: integer("at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

// 10. collect_checkpoints
export const collectCheckpoints = sqliteTable("collect_checkpoints", {
  jobName: text("job_name").primaryKey(),
  lastCursor: text("last_cursor"),
  processed: integer("processed").default(0),
  total: integer("total"),
  status: text("status"),
  errorMessage: text("error_message"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

// 11. user_reports
export const userReports = sqliteTable("user_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campsiteId: text("campsite_id").references(() => campsites.id),
  reportType: text("report_type"),
  content: text("content").notNull(),
  reporterEmail: text("reporter_email"),
  status: text("status").default("pending"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewerNote: text("reviewer_note"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

// 12. newsletter_subscribers
export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  status: text("status").default("subscribed"),
  marketingConsent: integer("marketing_consent", { mode: "boolean" }).default(false),
  consentedAt: integer("consented_at", { mode: "timestamp" }),
  unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
  subscribedAt: integer("subscribed_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

// 13. weather_cache
export const weatherCache = sqliteTable("weather_cache", {
  key: text("key").primaryKey(),
  data: text("data", { mode: "json" }),
  cachedAt: integer("cached_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

// 14. cosine_calibration
export const cosineCalibration = sqliteTable("cosine_calibration", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sampleSize: integer("sample_size"),
  meanSimilarity: real("mean_similarity"),
  stddev: real("stddev"),
  recommendedThreshold: real("recommended_threshold"),
  notes: text("notes"),
  calibratedAt: integer("calibrated_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});
