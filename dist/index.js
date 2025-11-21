var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";

// server/db/index.ts
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";

// server/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  scrapeJobs: () => scrapeJobs,
  scrapedImages: () => scrapedImages
});
import { pgTable, text, integer, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
var scrapeJobs = pgTable("scrape_jobs", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull().default(0),
  totalImages: integer("total_images").notNull().default(0),
  scrapedImages: integer("scraped_images").notNull().default(0),
  error: text("error"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  config: jsonb("config").notNull()
}, (table) => ({
  statusIdx: index("scrape_jobs_status_idx").on(table.status),
  startedAtIdx: index("scrape_jobs_started_at_idx").on(table.startedAt)
}));
var scrapedImages = pgTable("scraped_images", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull().references(() => scrapeJobs.id, { onDelete: "cascade" }),
  imageId: text("image_id").notNull(),
  hash: text("hash").notNull(),
  url: text("url").notNull(),
  copyLink: text("copy_link").notNull(),
  smartframeId: text("smartframe_id").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  // The 7 clean metadata fields for CSV export
  titleField: text("title_field"),
  subjectField: text("subject_field"),
  tags: text("tags"),
  comments: text("comments"),
  authors: text("authors"),
  dateTaken: text("date_taken"),
  copyright: text("copyright"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  jobIdIdx: index("scraped_images_job_id_idx").on(table.jobId),
  imageIdIdx: index("scraped_images_image_id_idx").on(table.imageId),
  imageIdJobIdIdx: index("scraped_images_image_id_job_id_idx").on(table.imageId, table.jobId),
  uniqueJobImage: unique("scraped_images_job_id_image_id_unique").on(table.jobId, table.imageId)
}));

// server/db/sqlite-schema.ts
var sqlite_schema_exports = {};
__export(sqlite_schema_exports, {
  scrapeJobs: () => scrapeJobs2,
  scrapedImages: () => scrapedImages2
});
import { sqliteTable, text as text2, integer as integer2, index as index2, unique as unique2 } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
var scrapeJobs2 = sqliteTable("scrape_jobs", {
  id: text2("id").primaryKey(),
  url: text2("url").notNull(),
  status: text2("status").notNull(),
  progress: integer2("progress").notNull().default(0),
  totalImages: integer2("total_images").notNull().default(0),
  scrapedImages: integer2("scraped_images").notNull().default(0),
  error: text2("error"),
  startedAt: integer2("started_at", { mode: "timestamp" }).notNull(),
  completedAt: integer2("completed_at", { mode: "timestamp" }),
  config: text2("config", { mode: "json" }).notNull()
}, (table) => ({
  statusIdx: index2("scrape_jobs_status_idx").on(table.status),
  startedAtIdx: index2("scrape_jobs_started_at_idx").on(table.startedAt)
}));
var scrapedImages2 = sqliteTable("scraped_images", {
  id: text2("id").primaryKey(),
  jobId: text2("job_id").notNull().references(() => scrapeJobs2.id, { onDelete: "cascade" }),
  imageId: text2("image_id").notNull(),
  hash: text2("hash").notNull(),
  url: text2("url").notNull(),
  copyLink: text2("copy_link").notNull(),
  smartframeId: text2("smartframe_id").notNull(),
  thumbnailUrl: text2("thumbnail_url"),
  // The 7 clean metadata fields for CSV export
  titleField: text2("title_field"),
  subjectField: text2("subject_field"),
  tags: text2("tags"),
  comments: text2("comments"),
  authors: text2("authors"),
  dateTaken: text2("date_taken"),
  copyright: text2("copyright"),
  createdAt: integer2("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
}, (table) => ({
  jobIdIdx: index2("scraped_images_job_id_idx").on(table.jobId),
  imageIdIdx: index2("scraped_images_image_id_idx").on(table.imageId),
  imageIdJobIdIdx: index2("scraped_images_image_id_job_id_idx").on(table.imageId, table.jobId),
  uniqueJobImage: unique2("scraped_images_job_id_image_id_unique").on(table.jobId, table.imageId)
}));

// server/db/index.ts
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
var __dirname = dirname(fileURLToPath(import.meta.url));
var isProduction = process.env.NODE_ENV === "production";
var isReplit = process.env.REPL_ID !== void 0;
var databaseUrl = process.env.DATABASE_URL;
var usePostgres = databaseUrl && (isProduction || isReplit);
var db;
var schema;
if (usePostgres) {
  console.log("\u{1F4CA} Using PostgreSQL database");
  const sql2 = neon(databaseUrl);
  db = drizzleNeon(sql2, { schema: schema_exports });
  schema = schema_exports;
} else {
  console.log("\u{1F4CA} Using SQLite database (local development)");
  const dbPath = process.env.SQLITE_DB_PATH || "./data/local.db";
  const dbDir = dirname(dbPath);
  try {
    await mkdir(dbDir, { recursive: true });
  } catch (error) {
  }
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite, { schema: sqlite_schema_exports });
  schema = sqlite_schema_exports;
  console.log("\u{1F528} Initializing SQLite database tables...");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scrape_jobs (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      total_images INTEGER NOT NULL DEFAULT 0,
      scraped_images INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      config TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS scrape_jobs_status_idx ON scrape_jobs(status);
    CREATE INDEX IF NOT EXISTS scrape_jobs_started_at_idx ON scrape_jobs(started_at);
    
    CREATE TABLE IF NOT EXISTS scraped_images (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      image_id TEXT NOT NULL,
      hash TEXT NOT NULL,
      url TEXT NOT NULL,
      copy_link TEXT NOT NULL,
      smartframe_id TEXT NOT NULL,
      thumbnail_url TEXT,
      title_field TEXT,
      subject_field TEXT,
      tags TEXT,
      comments TEXT,
      authors TEXT,
      date_taken TEXT,
      copyright TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (job_id) REFERENCES scrape_jobs(id) ON DELETE CASCADE,
      UNIQUE(job_id, image_id)
    );
    
    CREATE INDEX IF NOT EXISTS scraped_images_job_id_idx ON scraped_images(job_id);
    CREATE INDEX IF NOT EXISTS scraped_images_image_id_idx ON scraped_images(image_id);
    CREATE INDEX IF NOT EXISTS scraped_images_image_id_job_id_idx ON scraped_images(image_id, job_id);
  `);
  try {
    const checkQuery = sqlite.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='scraped_images'
    `);
    const tableInfo = checkQuery.get();
    if (tableInfo && (tableInfo.sql.includes("photographer") || tableInfo.sql.includes("caption"))) {
      console.log("\u{1F504} Migrating existing database to new clean metadata schema...");
      sqlite.exec(`
        DROP TABLE IF EXISTS scraped_images;
        
        CREATE TABLE scraped_images (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          image_id TEXT NOT NULL,
          hash TEXT NOT NULL,
          url TEXT NOT NULL,
          copy_link TEXT NOT NULL,
          smartframe_id TEXT NOT NULL,
          thumbnail_url TEXT,
          title_field TEXT,
          subject_field TEXT,
          tags TEXT,
          comments TEXT,
          authors TEXT,
          date_taken TEXT,
          copyright TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          FOREIGN KEY (job_id) REFERENCES scrape_jobs(id) ON DELETE CASCADE,
          UNIQUE(job_id, image_id)
        );
        
        CREATE INDEX scraped_images_job_id_idx ON scraped_images(job_id);
        CREATE INDEX scraped_images_image_id_idx ON scraped_images(image_id);
        CREATE INDEX scraped_images_image_id_job_id_idx ON scraped_images(image_id, job_id);
      `);
      console.log("\u2705 Migration complete - updated to clean metadata schema");
    }
  } catch (error) {
    console.error("Migration warning:", error);
  }
  console.log("\u2705 SQLite database ready");
}

// server/storage.ts
var PostgresStorage = class {
  async createScrapeJob(url, config) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    await db.insert(schema.scrapeJobs).values({
      id,
      url,
      status: "pending",
      progress: 0,
      totalImages: 0,
      scrapedImages: 0,
      error: null,
      startedAt: now,
      completedAt: null,
      config
    });
    return {
      id,
      url,
      status: "pending",
      progress: 0,
      totalImages: 0,
      scrapedImages: 0,
      images: [],
      error: null,
      startedAt: now.toISOString(),
      completedAt: null,
      config
    };
  }
  async getScrapeJob(id) {
    const [job] = await db.select().from(schema.scrapeJobs).where(eq(schema.scrapeJobs.id, id));
    if (!job) return void 0;
    const images = await db.select().from(schema.scrapedImages).where(eq(schema.scrapedImages.jobId, id));
    return {
      id: job.id,
      url: job.url,
      status: job.status,
      progress: job.progress,
      totalImages: job.totalImages,
      scrapedImages: job.scrapedImages,
      images: (images || []).map((img) => ({
        imageId: img.imageId,
        hash: img.hash,
        url: img.url,
        copyLink: img.copyLink,
        smartframeId: img.smartframeId,
        thumbnailUrl: img.thumbnailUrl,
        titleField: img.titleField,
        subjectField: img.subjectField,
        tags: img.tags,
        comments: img.comments,
        authors: img.authors,
        dateTaken: img.dateTaken,
        copyright: img.copyright
      })),
      error: job.error,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
      config: job.config
    };
  }
  async updateScrapeJob(id, updates) {
    const dbUpdates = {};
    if (updates.status !== void 0) dbUpdates.status = updates.status;
    if (updates.progress !== void 0) dbUpdates.progress = updates.progress;
    if (updates.totalImages !== void 0) dbUpdates.totalImages = updates.totalImages;
    if (updates.scrapedImages !== void 0) dbUpdates.scrapedImages = updates.scrapedImages;
    if (updates.error !== void 0) dbUpdates.error = updates.error;
    if (updates.completedAt !== void 0) {
      dbUpdates.completedAt = updates.completedAt ? new Date(updates.completedAt) : null;
    }
    if (Object.keys(dbUpdates).length > 0) {
      await db.update(schema.scrapeJobs).set(dbUpdates).where(eq(schema.scrapeJobs.id, id));
    }
    if (updates.images && updates.images.length > 0) {
      const imagesToInsert = updates.images.map((img) => ({
        id: randomUUID(),
        jobId: id,
        imageId: img.imageId,
        hash: img.hash,
        url: img.url,
        copyLink: img.copyLink,
        smartframeId: img.smartframeId,
        thumbnailUrl: img.thumbnailUrl,
        titleField: img.titleField,
        subjectField: img.subjectField,
        tags: img.tags,
        comments: img.comments,
        authors: img.authors,
        dateTaken: img.dateTaken,
        copyright: img.copyright
      }));
      await db.insert(schema.scrapedImages).values(imagesToInsert).onConflictDoNothing({ target: [schema.scrapedImages.jobId, schema.scrapedImages.imageId] });
      console.log(`\u2713 Inserted up to ${updates.images.length} images (duplicates automatically skipped by database)`);
    }
    return this.getScrapeJob(id);
  }
  async getAllScrapeJobs() {
    try {
      const jobs = await db.select().from(schema.scrapeJobs).orderBy(desc(schema.scrapeJobs.startedAt));
      if (!jobs || jobs.length === 0) {
        return [];
      }
      const jobsWithImages = await Promise.all(
        jobs.map(async (job) => {
          try {
            const images = await db.select().from(schema.scrapedImages).where(eq(schema.scrapedImages.jobId, job.id));
            return {
              id: job.id,
              url: job.url,
              status: job.status,
              progress: job.progress,
              totalImages: job.totalImages,
              scrapedImages: job.scrapedImages,
              images: (images || []).map((img) => ({
                imageId: img.imageId,
                hash: img.hash,
                url: img.url,
                copyLink: img.copyLink,
                smartframeId: img.smartframeId,
                thumbnailUrl: img.thumbnailUrl,
                titleField: img.titleField,
                subjectField: img.subjectField,
                tags: img.tags,
                comments: img.comments,
                authors: img.authors,
                dateTaken: img.dateTaken,
                copyright: img.copyright
              })),
              error: job.error,
              startedAt: job.startedAt.toISOString(),
              completedAt: job.completedAt?.toISOString() || null,
              config: job.config
            };
          } catch (imgError) {
            return {
              id: job.id,
              url: job.url,
              status: job.status,
              progress: job.progress,
              totalImages: job.totalImages,
              scrapedImages: job.scrapedImages,
              images: [],
              error: job.error,
              startedAt: job.startedAt.toISOString(),
              completedAt: job.completedAt?.toISOString() || null,
              config: job.config
            };
          }
        })
      );
      return jobsWithImages;
    } catch (error) {
      console.error("Error in getAllScrapeJobs (returning empty array):", error);
      return [];
    }
  }
};
var storage = new PostgresStorage();

// server/scraper.ts
import puppeteer from "puppeteer";

// server/utils/date-normalization.ts
import { parse, format, isValid } from "date-fns";
var DATE_FORMATS = [
  "yyyy-MM-dd",
  "dd MMM yyyy",
  "d MMM yyyy",
  "MMMM dd, yyyy",
  "MMMM d, yyyy",
  "MMM dd, yyyy",
  "MMM d, yyyy",
  "dd/MM/yyyy",
  "d/M/yyyy",
  "MM/dd/yyyy",
  "M/d/yyyy",
  "yyyy/MM/dd",
  "dd-MM-yyyy",
  "d-M-yyyy",
  "MM-dd-yyyy",
  "M-d-yyyy",
  "dd.MM.yyyy",
  "d.M.yyyy",
  "dd.MM.yy",
  "d.M.yy",
  "EEEE, MMMM dd, yyyy",
  "EEEE, MMMM d, yyyy",
  "EEEE, dd MMMM yyyy",
  "EEEE, d MMMM yyyy"
];
function repairCentury(year) {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  let repairedYear = year;
  if (repairedYear >= 0 && repairedYear < 1e3) {
    repairedYear = 2e3 + repairedYear;
  }
  if (repairedYear >= 1800 && repairedYear < 1900) {
    return repairedYear;
  }
  while (repairedYear > currentYear + 1) {
    repairedYear -= 100;
  }
  while (repairedYear < 1800) {
    repairedYear += 100;
  }
  return repairedYear;
}
function normalizeDate(dateString) {
  if (!dateString) return null;
  let cleanDateString = dateString.replace(/\.$/, "").replace(/(\d)(st|nd|rd|th)/g, "$1").trim();
  const truncatedYearMatch = cleanDateString.match(/^00(\d{2})[-/.](\d{2})[-/.](\d{2})$/);
  if (truncatedYearMatch) {
    const [, year, month, day] = truncatedYearMatch;
    cleanDateString = `20${year}-${month}-${day}`;
    console.log(`\u{1F527} Century repair: ${dateString} \u2192 ${cleanDateString}`);
  }
  const fourDigitTruncMatch = cleanDateString.match(/^0(\d{3})[-/.](\d{2})[-/.](\d{2})$/);
  if (fourDigitTruncMatch) {
    const [, year, month, day] = fourDigitTruncMatch;
    cleanDateString = `2${year}-${month}-${day}`;
    console.log(`\u{1F527} Century repair: ${dateString} \u2192 ${cleanDateString}`);
  }
  const referenceDate = /* @__PURE__ */ new Date();
  for (const fmt of DATE_FORMATS) {
    try {
      const parsedDate = parse(cleanDateString, fmt, referenceDate);
      if (isValid(parsedDate)) {
        const year = parsedDate.getFullYear();
        if (year < 1900 || year > (/* @__PURE__ */ new Date()).getFullYear() + 1) {
          const repairedYear = repairCentury(year);
          if (repairedYear !== year) {
            parsedDate.setFullYear(repairedYear);
            console.log(`\u{1F527} Century repair: ${year} \u2192 ${repairedYear} for date ${dateString}`);
          }
        }
        return format(parsedDate, "yyyy-MM-dd");
      }
    } catch (error) {
    }
  }
  try {
    const directParse = new Date(cleanDateString);
    if (isValid(directParse) && !isNaN(directParse.getTime())) {
      const year = directParse.getFullYear();
      if (year < 1900 || year > (/* @__PURE__ */ new Date()).getFullYear() + 1) {
        const repairedYear = repairCentury(year);
        directParse.setFullYear(repairedYear);
        console.log(`\u{1F527} Century repair: ${year} \u2192 ${repairedYear} for date ${dateString}`);
      }
      return format(directParse, "yyyy-MM-dd");
    }
  } catch (error) {
  }
  console.log(`\u26A0\uFE0F Unresolvable date format: "${dateString}"`);
  return null;
}

// server/utils/caption-generator.ts
function generateCaption(data) {
  const lines = [];
  if (data.title) {
    lines.push(data.title);
  }
  if (data.captionRaw) {
    lines.push(data.captionRaw);
  }
  if (data.featuring) {
    lines.push(`Featuring: ${data.featuring}`);
  }
  if (data.city || data.country) {
    const location = [data.city, data.country].filter(Boolean).join(", ");
    lines.push(`Where: ${location}`);
  }
  if (data.dateTaken) {
    lines.push(`When: ${data.dateTaken}`);
  }
  const credit = data.copyright || data.photographer;
  if (credit) {
    lines.push(`Credit: ${credit}`);
  }
  return lines.join("\n");
}

// server/utils/failed-scrapes-logger.ts
import fs from "fs";
import path from "path";
var FailedScrapesLogger = class {
  constructor() {
    this.currentJobId = null;
    this.failedScrapes = [];
    this.writeQueue = Promise.resolve();
    const logDir = path.join(process.cwd(), "failed-scrapes");
    this.ensureLogDirectory(logDir);
    this.logFilePath = path.join(logDir, "failed-scrapes.txt");
  }
  ensureLogDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  startJob(jobId) {
    this.currentJobId = jobId;
    this.failedScrapes = [];
  }
  addFailure(failure) {
    if (!this.currentJobId) {
      console.warn("\u26A0\uFE0F  Cannot add failure: no active job");
      return;
    }
    this.failedScrapes.push({
      ...failure,
      jobId: this.currentJobId
    });
  }
  async writeLogFile() {
    if (this.failedScrapes.length === 0) {
      return null;
    }
    this.writeQueue = this.writeQueue.then(() => this.appendToLogFile());
    await this.writeQueue;
    return this.logFilePath;
  }
  async appendToLogFile() {
    if (this.failedScrapes.length === 0) {
      return;
    }
    const fileExists = fs.existsSync(this.logFilePath);
    let content = "";
    if (fileExists) {
      content += "\n\n";
    }
    content += [
      "\u2550".repeat(80),
      `JOB: ${this.currentJobId}`,
      `Failed Images: ${this.failedScrapes.length}`,
      `Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
      "\u2550".repeat(80),
      ""
    ].join("\n");
    content += this.failedScrapes.map((failure, index3) => {
      const lines = [
        `[${index3 + 1}/${this.failedScrapes.length}] Image ID: ${failure.imageId}`,
        `Job ID: ${failure.jobId}`,
        `URL: ${failure.url}`,
        `Reason: ${failure.reason}`,
        `Attempts: ${failure.attempts}`
      ];
      if (failure.retryAttempt !== void 0) {
        lines.push(`Retry Attempt: ${failure.retryAttempt}`);
      }
      if (failure.httpStatus) {
        lines.push(`HTTP Status: ${failure.httpStatus}`);
      }
      lines.push(`Timestamp: ${failure.timestamp}`);
      lines.push("\u2500".repeat(80));
      return lines.join("\n");
    }).join("\n");
    await fs.promises.appendFile(this.logFilePath, content, "utf-8");
    console.log(`
\u{1F4DD} Failed scrapes appended to: ${this.logFilePath}
`);
    this.failedScrapes = [];
  }
  removeSuccess(imageId) {
    const initialLength = this.failedScrapes.length;
    this.failedScrapes = this.failedScrapes.filter((f) => f.imageId !== imageId);
    if (this.failedScrapes.length < initialLength) {
      console.log(`\u2705 Removed ${imageId} from failed list (retry successful)`);
    }
  }
  getFailureCount() {
    return this.failedScrapes.length;
  }
  getFailures() {
    return [...this.failedScrapes];
  }
  reset() {
    this.currentJobId = null;
    this.failedScrapes = [];
  }
  getLogFilePath() {
    return this.logFilePath;
  }
  async readFailuresFromFile() {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        return [];
      }
      const content = await fs.promises.readFile(this.logFilePath, "utf-8");
      const failures = [];
      const lines = content.split("\n");
      let currentFailure = {};
      for (const line of lines) {
        if (line.includes("Image ID:")) {
          const imageId = line.split("Image ID:")[1]?.trim();
          if (imageId) currentFailure.imageId = imageId;
        } else if (line.includes("Job ID:")) {
          const jobId = line.split("Job ID:")[1]?.trim();
          if (jobId) currentFailure.jobId = jobId;
        } else if (line.includes("URL:")) {
          const url = line.split("URL:")[1]?.trim();
          if (url) currentFailure.url = url;
        } else if (line.includes("Reason:")) {
          const reason = line.split("Reason:")[1]?.trim();
          if (reason) currentFailure.reason = reason;
        } else if (line.includes("Attempts:")) {
          const attempts = parseInt(line.split("Attempts:")[1]?.trim() || "0");
          if (!isNaN(attempts)) currentFailure.attempts = attempts;
        } else if (line.includes("HTTP Status:")) {
          const status = parseInt(line.split("HTTP Status:")[1]?.trim() || "0");
          if (!isNaN(status)) currentFailure.httpStatus = status;
        } else if (line.includes("Timestamp:")) {
          const timestamp2 = line.split("Timestamp:")[1]?.trim();
          if (timestamp2) currentFailure.timestamp = timestamp2;
          if (currentFailure.imageId && currentFailure.jobId && currentFailure.url && currentFailure.reason && currentFailure.attempts && currentFailure.timestamp) {
            failures.push(currentFailure);
          }
          currentFailure = {};
        }
      }
      console.log(`\u{1F4D6} Read ${failures.length} failed scrapes from log file`);
      return failures;
    } catch (error) {
      console.error("Error reading failed scrapes file:", error);
      return [];
    }
  }
  async removeFromFile(successfulImageIds) {
    try {
      if (!fs.existsSync(this.logFilePath) || successfulImageIds.length === 0) {
        return;
      }
      const content = await fs.promises.readFile(this.logFilePath, "utf-8");
      const lines = content.split("\n");
      const filteredLines = [];
      let skipBlock = false;
      let currentImageId = "";
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("Image ID:")) {
          const imageId = line.split("Image ID:")[1]?.trim();
          currentImageId = imageId || "";
          skipBlock = successfulImageIds.includes(currentImageId);
        }
        if (line.match(/^─{80}$/)) {
          skipBlock = false;
          currentImageId = "";
        }
        if (!skipBlock) {
          filteredLines.push(line);
        }
      }
      await fs.promises.writeFile(this.logFilePath, filteredLines.join("\n"), "utf-8");
      console.log(`\u2705 Removed ${successfulImageIds.length} successful retries from failed-scrapes.txt`);
    } catch (error) {
      console.error("Error removing from failed scrapes file:", error);
    }
  }
};
var failedScrapesLogger = new FailedScrapesLogger();

// server/utils/vpn-manager.ts
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var VPNManager = class {
  constructor(config) {
    this.isConnected = false;
    this.config = config;
  }
  async changeVPN() {
    if (!this.config.enabled || !this.config.command) {
      console.log("VPN rotation is disabled or no command configured");
      return;
    }
    console.log("\n" + "=".repeat(60));
    console.log("VPN ROTATION REQUESTED");
    console.log("=".repeat(60));
    console.log(`Command: ${this.config.command}`);
    console.log("Please execute the VPN change command in your terminal.");
    console.log("Waiting for VPN connection to be established...");
    console.log("=".repeat(60) + "\n");
    if (this.config.command && this.config.command !== "manual") {
      try {
        console.log(`Executing VPN command: ${this.config.command}`);
        const { stdout, stderr } = await execAsync(this.config.command);
        if (stdout) {
          console.log("VPN Command Output:", stdout);
        }
        if (stderr) {
          console.warn("VPN Command Warnings:", stderr);
        }
        console.log("\u2705 VPN command executed successfully");
      } catch (error) {
        console.error("\u274C VPN command execution failed:", error instanceof Error ? error.message : error);
        console.log("Please manually change your VPN connection");
      }
    }
    await this.waitForConnection();
  }
  async waitForConnection() {
    console.log("\n\u23F3 Verifying VPN connection...");
    let attempts = 0;
    const maxAttempts = this.config.maxRetries || 10;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.connectionVerifyTimeout || 5e3);
        const response = await fetch(this.config.connectionVerifyUrl || "https://www.google.com", {
          signal: controller.signal,
          method: "HEAD"
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          console.log(`\u2705 Connection verified (attempt ${attempts}/${maxAttempts})`);
          this.isConnected = true;
          try {
            const ipResponse = await fetch("https://api.ipify.org?format=json");
            const ipData = await ipResponse.json();
            console.log(`\u{1F4CD} Current IP: ${ipData.ip}`);
          } catch (ipError) {
          }
          return;
        }
      } catch (error) {
        console.log(`\u26A0\uFE0F  Connection check failed (attempt ${attempts}/${maxAttempts})`);
      }
      if (attempts < maxAttempts) {
        const delay = this.config.retryDelay || 2e3;
        console.log(`\u23F3 Waiting ${delay}ms before next connection check...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error(`Failed to verify VPN connection after ${maxAttempts} attempts. Please check your VPN connection manually.`);
  }
  async ensureConnection() {
    if (!this.config.enabled) {
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e3);
      const response = await fetch(this.config.connectionVerifyUrl || "https://www.google.com", {
        signal: controller.signal,
        method: "HEAD"
      });
      clearTimeout(timeoutId);
      this.isConnected = response.ok;
    } catch (error) {
      this.isConnected = false;
      console.warn("\u26A0\uFE0F  Connection check failed, may need VPN rotation");
    }
  }
  isVPNConnected() {
    return this.isConnected;
  }
  static createDefaultConfig() {
    return {
      enabled: false,
      command: "manual",
      connectionVerifyUrl: "https://www.google.com",
      connectionVerifyTimeout: 5e3,
      maxRetries: 10,
      retryDelay: 2e3
    };
  }
};

// server/utils/wait-time-helper.ts
var WaitTimeHelper = class _WaitTimeHelper {
  constructor(config) {
    this.config = config;
  }
  getRandomDelay() {
    const variance = Math.random() * (this.config.maxVariance - this.config.minVariance) + this.config.minVariance;
    const totalDelay = this.config.baseDelay + variance;
    return Math.round(totalDelay);
  }
  async wait(customBase) {
    const baseDelay = customBase !== void 0 ? customBase : this.config.baseDelay;
    const variance = Math.random() * (this.config.maxVariance - this.config.minVariance) + this.config.minVariance;
    const totalDelay = baseDelay + variance;
    const delay = Math.round(totalDelay);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  static createDefault() {
    return new _WaitTimeHelper({
      baseDelay: 1e3,
      minVariance: 2e3,
      maxVariance: 5e3
    });
  }
  static createFromConfig(scrollDelay, minExtra = 2e3, maxExtra = 5e3) {
    return new _WaitTimeHelper({
      baseDelay: scrollDelay,
      minVariance: minExtra,
      maxVariance: maxExtra
    });
  }
};

// server/utils/smartframe-extension/extension-manager.ts
import fs2 from "fs";
import path2 from "path";
import os from "os";

// server/utils/smartframe-extension/extension-files.ts
var MANIFEST_JSON = {
  manifest_version: 3,
  name: "Canvas Data Extractor",
  version: "2.0",
  description: "Extracts data from a canvas, bypassing taint restrictions (Manifest V3).",
  permissions: ["scripting"],
  host_permissions: ["<all_urls>"],
  background: {
    service_worker: "background.js"
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content_script.js"],
      run_at: "document_start"
    }
  ],
  web_accessible_resources: [
    {
      resources: ["*"],
      matches: ["<all_urls>"]
    }
  ]
};
var BACKGROUND_JS = `
console.log("Canvas Extractor V3: Service Worker loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Canvas Extractor V3: Message received in service worker.", request);
  
  if (request.action === "getCanvasDataURL") {
    console.log(\`Canvas Extractor V3: Executing script in tab \${sender.tab.id} to get canvas data.\`);
    
    // Manifest V3: Use chrome.scripting.executeScript instead of chrome.tabs.executeScript
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN', // CRITICAL: Run in MAIN world to access window.__smartFrameShadowRoot
      func: (selector) => {
        console.log('Canvas Extractor [Privileged]: Script started in page context.');
          const selectorsToTry = [];
          if (selector) {
            selectorsToTry.push(selector);
          }
          if (window.__SMARTFRAME_TARGET_IMAGE_ID) {
            selectorsToTry.push(\`smartframe-embed[image-id="\${window.__SMARTFRAME_TARGET_IMAGE_ID}"]\`);
          }
          selectorsToTry.push('smartframe-embed:not([thumbnail-mode])');
          selectorsToTry.push('smartframe-embed');

          let smartframeEmbed = null;
          for (const candidateSelector of selectorsToTry) {
            try {
              const candidate = document.querySelector(candidateSelector);
              if (candidate) {
                smartframeEmbed = candidate;
                console.log(\`Canvas Extractor [Privileged]: smartframe-embed resolved via selector '\${candidateSelector}'.\`);
                break;
              }
            } catch (err) {
              console.warn(\`Canvas Extractor [Privileged]: Selector '\${candidateSelector}' threw an error:\`, err);
            }
          }

          if (!smartframeEmbed) {
            console.error('Canvas Extractor [Privileged]: smartframe-embed not found.');
            return { error: 'smartframe-embed element not found' };
          }
        console.log('Canvas Extractor [Privileged]: smartframe-embed found.');
        
        // Function to search for canvas with retry logic
        // Increased from 10 to 15 attempts and delay from 500ms to 1000ms for large canvas dimensions (9999x9999)
        function findCanvas(maxAttempts = 15, delay = 1000) {
          return new Promise((resolve) => {
            let attempts = 0;
            
            function tryFind() {
              attempts++;
              console.log(\`Canvas Extractor [Privileged]: Search attempt \${attempts}/\${maxAttempts}\`);
              
              let canvas = null;
              
              // First, try to use the captured shadow root from window object
              if (window.__smartFrameShadowRoot) {
                console.log('Canvas Extractor [Privileged]: Checking captured shadow root...');
                const allCanvases = window.__smartFrameShadowRoot.querySelectorAll('canvas');
                console.log(\`Canvas Extractor [Privileged]: Found \${allCanvases.length} canvas element(s) in captured shadowRoot\`);
                
                canvas = window.__smartFrameShadowRoot.querySelector('canvas.stage');
                if (!canvas) {
                  canvas = window.__smartFrameShadowRoot.querySelector('canvas');
                }
                if (canvas) {
                  console.log('Canvas Extractor [Privileged]: Canvas found in captured shadowRoot');
                }
              } else {
                console.log('Canvas Extractor [Privileged]: window.__smartFrameShadowRoot is null/undefined');
              }
              
              // If not found via captured reference, try direct shadowRoot access
              if (!canvas) {
                const shadowRoot = smartframeEmbed.shadowRoot;
                if (shadowRoot) {
                  console.log('Canvas Extractor [Privileged]: Checking direct shadowRoot access...');
                  const allCanvases = shadowRoot.querySelectorAll('canvas');
                  console.log(\`Canvas Extractor [Privileged]: Found \${allCanvases.length} canvas element(s) in direct shadowRoot\`);
                  
                  canvas = shadowRoot.querySelector('canvas.stage');
                  if (!canvas) {
                    canvas = shadowRoot.querySelector('canvas');
                  }
                  if (canvas) {
                    console.log('Canvas Extractor [Privileged]: Canvas found in shadowRoot via direct access');
                  }
                } else {
                  console.log('Canvas Extractor [Privileged]: smartframeEmbed.shadowRoot is null');
                }
              }
              
              // Fallback to searching the entire document if not found in shadow DOM
              if (!canvas) {
                console.log('Canvas Extractor [Privileged]: Searching in document...');
                const allCanvases = document.querySelectorAll('canvas');
                console.log(\`Canvas Extractor [Privileged]: Found \${allCanvases.length} canvas element(s) in document\`);
                
                canvas = document.querySelector('canvas.stage');
                if (!canvas) {
                  canvas = document.querySelector('canvas[width][height]');
                  if (!canvas) {
                    canvas = document.querySelector('canvas');
                  }
                }
                if (canvas) {
                  console.log('Canvas Extractor [Privileged]: Canvas found in document');
                }
              }
              
              if (canvas) {
                console.log(\`Canvas Extractor [Privileged]: Canvas found on attempt \${attempts}. Width: \${canvas.width}, Height: \${canvas.height}\`);
                resolve(canvas);
              } else if (attempts < maxAttempts) {
                console.log(\`Canvas Extractor [Privileged]: Canvas not found, retrying in \${delay}ms...\`);
                setTimeout(tryFind, delay);
              } else {
                console.error('Canvas Extractor [Privileged]: Canvas element not found after all attempts.');
                resolve(null);
              }
            }
            
            tryFind();
          });
        }
        
        // Return a promise that resolves with the result
        return findCanvas().then(canvas => {
          if (!canvas) {
            return { error: 'Canvas element not found after all retry attempts' };
          }

          console.log('Canvas Extractor [Privileged]: Canvas found. Attempting to get data URL.');
          try {
            // CRITICAL FIX: Use original toDataURL and apply to current canvas
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width || 1920; 
            tempCanvas.height = canvas.height || 1080;

            const dataUrl = tempCanvas.toDataURL.call(canvas, 'image/png');
            console.log('Canvas Extractor [Privileged]: Successfully generated data URL length:', dataUrl ? dataUrl.length : 'null');
            return { dataUrl: dataUrl };
          } catch (e) {
            console.error('Canvas Extractor [Privileged]: Error calling toDataURL:', e);
            return { error: 'Error calling toDataURL: ' + e.message };
          }
        });
      },
      args: [request.selector]
    }).then(results => {
      console.log("Canvas Extractor V3: Script execution finished.");
      const result = results && results[0] && results[0].result;
      console.log("Canvas Extractor V3: Sending response:", result);
      sendResponse(result || { error: 'No result from script execution' });
    }).catch(error => {
      console.error("Canvas Extractor V3: Error executing script in tab:", error);
      sendResponse({ error: error.toString() });
    });
    
    // Return true to indicate asynchronous response
    return true;
  }
});
`;
var CONTENT_SCRIPT_JS = `
console.log("Canvas Extractor V3: Content script loaded.");

// Listen for messages from the page context via window.postMessage
window.addEventListener('message', function(event) {
  // Verify origin matches current page (security check)
  if (event.origin !== window.location.origin) {
    return;
  }
  
  // Only accept messages from the same window (not from iframes)
  if (event.source !== window) {
    return;
  }
  
  // Check if this is our custom message
  if (event.data && event.data.type === 'GET_CANVAS_DATA') {
    console.log("Canvas Extractor V3 [Content]: 'GET_CANVAS_DATA' message received by content script.");
    const selector = event.data.selector;

    console.log(\`Canvas Extractor V3 [Content]: Sending message to service worker for selector: \${selector}\`);
    
    // Send a message to the service worker, requesting the data URL
    chrome.runtime.sendMessage({
      action: "getCanvasDataURL",
      selector: selector
    }).then(response => {
      console.log("Canvas Extractor V3 [Content]: Received response from service worker.", response);
      
      // Create a temporary element in the DOM to hold the response data
      const responseDiv = document.createElement('div');
      responseDiv.id = 'extension-response-data';
      responseDiv.style.display = 'none';
      
      if (response && response.dataUrl) {
        console.log("Canvas Extractor V3 [Content]: Data URL received, creating response div with data-url.");
        responseDiv.setAttribute('data-url', response.dataUrl);
      } else {
        const errorMsg = (response && response.error) || "Unknown error: No data URL returned.";
        console.error(\`Canvas Extractor V3 [Content]: Error received from service worker: \${errorMsg}\`);
        responseDiv.setAttribute('data-error', errorMsg);
      }
      document.body.appendChild(responseDiv);
      console.log("Canvas Extractor V3 [Content]: Appended responseDiv to body.");
    }).catch(error => {
      console.error("Canvas Extractor V3 [Content]: Error sending message or receiving response from service worker:", error);
      
      // Still try to append a div to indicate failure
      const responseDiv = document.createElement('div');
      responseDiv.id = 'extension-response-data';
      responseDiv.style.display = 'none';
      responseDiv.setAttribute('data-error', 'Communication error: ' + error.toString());
      document.body.appendChild(responseDiv);
      console.log("Canvas Extractor V3 [Content]: Appended error responseDiv to body after communication error.");
    });
  }
});
`;
var INJECTED_JAVASCRIPT = `
    (function() {
      // Store reference to smartframe-embed shadow root on window object for extension access
      // Only initialize if not already set by another script
      if (window.__smartFrameShadowRoot === undefined) {
          window.__smartFrameShadowRoot = null;
      }
      if (window.__smartFrameHostElement === undefined) {
          window.__smartFrameHostElement = null;
      }
      if (window.__SMARTFRAME_EMBED_SELECTOR === undefined) {
          window.__SMARTFRAME_EMBED_SELECTOR = null;
      }
      if (window.__SMARTFRAME_TARGET_IMAGE_ID === undefined) {
          window.__SMARTFRAME_TARGET_IMAGE_ID = null;
      }
      const nativeAttachShadow = Element.prototype.attachShadow;
      Element.prototype.attachShadow = function(init) {
          const shadowRoot = nativeAttachShadow.call(this, init);
          if (this.tagName.toLowerCase() === 'smartframe-embed') {
              const targetSelector = window.__SMARTFRAME_EMBED_SELECTOR;
              const targetImageId = window.__SMARTFRAME_TARGET_IMAGE_ID;
              const imageId = this.getAttribute('image-id');
              
              const matchesImageId = Boolean(targetImageId && imageId === targetImageId);
              const matchesSelector = Boolean(targetSelector && typeof this.matches === 'function' && this.matches(targetSelector));
              const shouldCapture = matchesImageId || matchesSelector || window.__smartFrameShadowRoot === null;
              
              if (shouldCapture) {
                  window.__smartFrameShadowRoot = shadowRoot;
                  window.__smartFrameHostElement = this;
                  console.log('Injected JavaScript (Main Page): Captured smartframe-embed shadow root reference.');
                  
                  // Log initial canvas count in shadow root
                  setTimeout(() => {
                      const canvases = shadowRoot.querySelectorAll('canvas');
                      console.log(\`Injected JavaScript (Main Page): Shadow root has \${canvases.length} canvas element(s) initially.\`);
                  }, 100);
              }
          }
          return shadowRoot;
      };

    console.log('Injected JavaScript (Main Page): Shadow root capture hook applied.');

      const smartframeEmbedSelector = window.__SMARTFRAME_EMBED_SELECTOR || 'smartframe-embed';
      const smartframeTargetImageId = window.__SMARTFRAME_TARGET_IMAGE_ID || null;
      
      function resolveSmartFrameElement() {
          const selectorsToTry = [];
          
          if (smartframeTargetImageId) {
              selectorsToTry.push(\`smartframe-embed[image-id="\${smartframeTargetImageId}"]\`);
          }
          
          if (smartframeEmbedSelector && !selectorsToTry.includes(smartframeEmbedSelector)) {
              selectorsToTry.push(smartframeEmbedSelector);
          }
          
          selectorsToTry.push('smartframe-embed:not([thumbnail-mode])');
          selectorsToTry.push('smartframe-embed');
          
          for (const selector of selectorsToTry) {
              if (!selector) {
                  continue;
              }
              
              try {
                  const candidate = document.querySelector(selector);
                  if (candidate) {
                      console.log(\`Injected JavaScript (Main Page): SmartFrame candidate found via selector '\${selector}'.\`);
                      return { element: candidate, selector };
                  }
              } catch (err) {
                  console.warn(\`Injected JavaScript (Main Page): Selector '\${selector}' threw an error:\`, err);
              }
          }
          
          return { element: null, selector: smartframeEmbedSelector };
      }
    
    // Guard to prevent multiple executions
    let extractionInitialized = false;

    // Use event-based initialization instead of polling
    function initSmartFrameExtraction() {
        // Prevent multiple executions
        if (extractionInitialized) {
            return;
        }
        
      const { element: smartFrame, selector: resolvedSelector } = resolveSmartFrameElement();
      if (smartFrame) {
            extractionInitialized = true;
            console.log('Injected JavaScript (Main Page): smartframe-embed found.');
          window.__SMARTFRAME_ACTIVE_SELECTOR = resolvedSelector;
          window.__smartFrameHostElement = smartFrame;
          
          if (!window.__smartFrameShadowRoot && smartFrame.shadowRoot) {
              window.__smartFrameShadowRoot = smartFrame.shadowRoot;
          }

            // Retrieve original image dimensions from custom CSS properties
            const width = smartFrame.style.getPropertyValue('--sf-original-width');
            const height = smartFrame.style.getPropertyValue('--sf-original-height');

            // Apply correct dimensions to the smartframe-embed element's CSS
            // getPropertyValue returns an empty string if property doesn't exist
            if (width && height && width.trim() !== '' && height.trim() !== '' && width !== '0' && width !== '0px' && height !== '0' && height !== '0px') {
                // Add 'px' suffix if not already present (convert to string to be safe)
                const widthStr = String(width).trim();
                const heightStr = String(height).trim();
                const widthValue = widthStr.endsWith('px') ? widthStr : widthStr + 'px';
                const heightValue = heightStr.endsWith('px') ? heightStr : heightStr + 'px';
                
                smartFrame.style.width = widthValue;
                smartFrame.style.maxWidth = widthValue;
                smartFrame.style.height = heightValue;
                smartFrame.style.maxHeight = heightValue;
                console.log(\`Injected JavaScript (Main Page): SmartFrame container dimensions set to \${widthValue} x \${heightValue} from CSS vars.\`);
            } else {
                console.warn('Injected JavaScript (Main Page): Could not retrieve valid --sf-original-width/height. Attempting to set large fixed size.');
                smartFrame.style.width = '9999px';
                smartFrame.style.maxWidth = '9999px';
                smartFrame.style.height = '9999px';
                smartFrame.style.maxHeight = '9999px';
                console.log('Injected JavaScript (Main Page): SmartFrame container dimensions set to 9999px x 9999px (fixed fallback).');
            }
            
            // Dispatch a window resize event to encourage SmartFrame to re-render its canvas
            window.dispatchEvent(new Event('resize'));
            console.log('Injected JavaScript (Main Page): Dispatched window resize event.');

            // Wait for rendering before dispatching to extension
            // Timeout history: 15s (initial) \u2192 2s (v2 optimization) \u2192 1s (v3, matches TamperMonkey script) \u2192 3s (current fix for large dimension rendering)
            // Increased to 3 seconds to allow SmartFrame sufficient time to detect resize event
            // and re-render canvas at the new large dimensions (9999x9999)
            setTimeout(() => {
                console.log('Injected JavaScript (Main Page): Attempting to send message to content script via window.postMessage.');
                window.postMessage({
                    type: 'GET_CANVAS_DATA',
                      selector: resolvedSelector || smartframeEmbedSelector
                }, window.location.origin);
                console.log('Injected JavaScript (Main Page): Message sent to content script.');
            }, 3000);
        } else {
            console.warn('Injected JavaScript (Main Page): smartframe-embed not found on page.');
        }
    }

    // Execute immediately since this script is injected AFTER page load
    // The page has already loaded when Puppeteer injects this script
    console.log('Injected JavaScript (Main Page): Document ready state:', document.readyState);
    
    // Try immediately first
    initSmartFrameExtraction();
    
    // Also add delayed retries to handle cases where SmartFrame loads asynchronously
    setTimeout(initSmartFrameExtraction, 500);
    setTimeout(initSmartFrameExtraction, 1000);
    setTimeout(initSmartFrameExtraction, 2000);
    
    // Still listen for load as fallback (in case page isn't fully loaded yet)
    if (document.readyState === 'loading') {
        window.addEventListener('load', initSmartFrameExtraction);
        document.addEventListener('DOMContentLoaded', initSmartFrameExtraction);
    }
})();
`;

// server/utils/smartframe-extension/extension-manager.ts
var SmartFrameExtensionManager = class {
  constructor() {
    this.extensionDir = null;
  }
  /**
   * Set up the Chrome extension files in a temporary directory
   * @returns Path to the extension directory
   */
  async setupExtension() {
    const tempDir = fs2.mkdtempSync(path2.join(os.tmpdir(), "smartframe-extension-"));
    this.extensionDir = tempDir;
    console.log(`Creating SmartFrame extension in: ${tempDir}`);
    const manifestPath = path2.join(tempDir, "manifest.json");
    fs2.writeFileSync(manifestPath, JSON.stringify(MANIFEST_JSON, null, 2));
    const backgroundPath = path2.join(tempDir, "background.js");
    fs2.writeFileSync(backgroundPath, BACKGROUND_JS);
    const contentScriptPath = path2.join(tempDir, "content_script.js");
    fs2.writeFileSync(contentScriptPath, CONTENT_SCRIPT_JS);
    console.log("\u2713 Chrome extension files created successfully");
    return tempDir;
  }
  /**
   * Clean up the extension directory
   */
  cleanup() {
    if (this.extensionDir && fs2.existsSync(this.extensionDir)) {
      try {
        fs2.rmSync(this.extensionDir, { recursive: true, force: true });
        console.log(`\u2713 Cleaned up extension directory: ${this.extensionDir}`);
        this.extensionDir = null;
      } catch (error) {
        console.error(`Failed to clean up extension directory:`, error);
      }
    }
  }
  /**
   * Get the extension directory path
   */
  getExtensionDir() {
    return this.extensionDir;
  }
};

// server/utils/smartframe-extension/canvas-extractor.ts
import fs3 from "fs";
import path3 from "path";
import sharp from "sharp";
var SmartFrameCanvasExtractor = class {
  constructor() {
    this.config = null;
    try {
      const configPath = path3.join(process.cwd(), "scraper.config.json");
      const configData = fs3.readFileSync(configPath, "utf-8");
      this.config = JSON.parse(configData);
      console.log("[SmartFrame Canvas] Loaded configuration from scraper.config.json");
    } catch (error) {
      console.warn("[SmartFrame Canvas] Could not load scraper.config.json, using defaults");
      this.config = {
        smartframe: {
          initialRenderWaitMs: 19e3,
          postResizeWaitMs: 1e4,
          jpgQuality: { thumbnail: 80, full: 92 },
          minValidFileSize: 51200,
          minValidDimensions: 500
        }
      };
    }
  }
  /**
   * Helper method to wait for a specified duration
   */
  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Extract canvas image from SmartFrame embed
   * @param page - Puppeteer page instance
   * @param imageId - SmartFrame image ID
   * @param outputDir - Directory to save extracted images
   * @param viewportMode - Viewport mode: "full" (9999x9999) or "thumbnail" (600x600)
   * @returns Path to extracted image file, or null if extraction failed
   */
  /**
   * Setup shadow root capture hook on a page BEFORE navigation
   * This must be called before navigating to ensure attachShadow is intercepted
   */
  async setupShadowRootCapture(page, imageId) {
    const smartframeEmbedSelector = `smartframe-embed[image-id="${imageId}"]`;
    const initScript = `
      window.__SMARTFRAME_EMBED_SELECTOR = ${JSON.stringify(smartframeEmbedSelector)};
      window.__SMARTFRAME_TARGET_IMAGE_ID = ${JSON.stringify(imageId)};
    `;
    await page.evaluateOnNewDocument(initScript);
    await page.evaluateOnNewDocument(INJECTED_JAVASCRIPT);
    console.log("[SmartFrame Canvas] Shadow root capture hook registered (will execute on page load)");
  }
  async extractCanvasImage(page, imageId, outputDir, viewportMode = "thumbnail") {
    console.log(`[SmartFrame Canvas] Extracting canvas image for ${imageId} in ${viewportMode} mode`);
    try {
      await page.bringToFront();
      console.log("[SmartFrame Canvas] Tab brought to front for GPU rendering");
      const initialWaitMs = this.config?.smartframe?.initialRenderWaitMs || 19e3;
      console.log(`[SmartFrame Canvas] Waiting ${initialWaitMs}ms for initial canvas render...`);
      await this.wait(initialWaitMs);
      try {
        await page.mouse.move(500, 500);
        await page.mouse.move(600, 600);
        console.log("[SmartFrame Canvas] Simulated mouse interaction to keep canvas active");
      } catch (error) {
        console.log("[SmartFrame Canvas] Mouse interaction skipped (optional)");
      }
      const postResizeWaitMs = this.config?.smartframe?.postResizeWaitMs || 1e4;
      console.log(`[SmartFrame Canvas] Waiting ${postResizeWaitMs}ms after viewport setup...`);
      await this.wait(postResizeWaitMs);
      console.log("[SmartFrame Canvas] Waiting for canvas extraction to complete...");
      const responseSelector = "#extension-response-data";
      await page.waitForSelector(
        `${responseSelector}[data-url], ${responseSelector}[data-error]`,
        { timeout: 12e4 }
        // 2 minutes timeout for large canvas rendering
      );
      const imageDataUrl = await page.$eval(
        responseSelector,
        (el) => el.getAttribute("data-url")
      );
      const errorFromExtension = await page.$eval(
        responseSelector,
        (el) => el.getAttribute("data-error")
      );
      if (errorFromExtension) {
        console.error(`[SmartFrame Canvas] Extension error: ${errorFromExtension}`);
        return null;
      }
      if (!imageDataUrl || !imageDataUrl.startsWith("data:image/png;base64,")) {
        console.error("[SmartFrame Canvas] No valid canvas data URL received");
        return null;
      }
      const base64Data = imageDataUrl.split(",")[1];
      const imageBuffer = Buffer.from(base64Data, "base64");
      const sanitizedId = imageId.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const pngFilename = `${sanitizedId}_canvas_${viewportMode}.png`;
      const pngPath = path3.join(outputDir, pngFilename);
      fs3.writeFileSync(pngPath, imageBuffer);
      console.log(`[SmartFrame Canvas] Saved intermediate PNG: ${pngPath}`);
      const jpgQuality = viewportMode === "full" ? this.config?.smartframe?.jpgQuality?.full || 92 : this.config?.smartframe?.jpgQuality?.thumbnail || 80;
      const jpgFilename = `${sanitizedId}_canvas_${viewportMode}.jpg`;
      const jpgPath = path3.join(outputDir, jpgFilename);
      console.log(`[SmartFrame Canvas] Converting PNG to JPG (quality: ${jpgQuality})...`);
      await sharp(imageBuffer).jpeg({ quality: jpgQuality }).toFile(jpgPath);
      fs3.unlinkSync(pngPath);
      console.log(`[SmartFrame Canvas] Deleted intermediate PNG file: ${pngFilename}`);
      console.log(`[SmartFrame Canvas] Saved JPG image: ${jpgPath}`);
      const minFileSize = this.config?.smartframe?.minValidFileSize || 51200;
      const minDimensions = this.config?.smartframe?.minValidDimensions || 500;
      const fileStats = fs3.statSync(jpgPath);
      const fileSizeBytes = fileStats.size;
      console.log(`[SmartFrame Canvas] Validating file size: ${fileSizeBytes} bytes (minimum: ${minFileSize} bytes)`);
      if (fileSizeBytes < minFileSize) {
        console.error(`[SmartFrame Canvas] \u274C VALIDATION FAILED: File size ${fileSizeBytes} bytes is below minimum ${minFileSize} bytes`);
        fs3.unlinkSync(jpgPath);
        console.log(`[SmartFrame Canvas] Deleted invalid file: ${jpgFilename}`);
        return null;
      }
      const metadata = await sharp(jpgPath).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      console.log(`[SmartFrame Canvas] Validating dimensions: ${width}x${height} (minimum: ${minDimensions}px)`);
      if (width < minDimensions || height < minDimensions) {
        console.error(`[SmartFrame Canvas] \u274C VALIDATION FAILED: Dimensions ${width}x${height} are below minimum ${minDimensions}px`);
        fs3.unlinkSync(jpgPath);
        console.log(`[SmartFrame Canvas] Deleted invalid file: ${jpgFilename}`);
        return null;
      }
      console.log(`[SmartFrame Canvas] \u2705 VALIDATION PASSED: File size ${fileSizeBytes} bytes, dimensions ${width}x${height}`);
      console.log(`[SmartFrame Canvas] Successfully extracted and validated canvas image: ${jpgFilename}`);
      return jpgPath;
    } catch (error) {
      console.error(`[SmartFrame Canvas] Error extracting canvas:`, error);
      return null;
    }
  }
  /**
   * Convert PNG to JPG (optional, for compatibility)
   * Note: This would require an image processing library like sharp
   * For now, we'll just return the PNG path
   */
  async convertToJpg(pngPath) {
    console.log("[SmartFrame Canvas] PNG to JPG conversion not yet implemented, returning PNG");
    return pngPath;
  }
};

// server/scraper.ts
import fs4 from "fs";
import path4 from "path";
var metadataCache = /* @__PURE__ */ new Map();
var SmartFrameScraper = class {
  constructor() {
    this.browser = null;
    this.vpnManager = null;
    this.waitTimeHelper = null;
    this.consecutiveFailures = 0;
    this.config = null;
    this.jobQueue = [];
    this.runningJobs = 0;
    this.maxConcurrentJobs = 3;
    this.extensionManager = null;
    this.canvasExtractor = null;
    this.extensionDir = null;
  }
  async initialize() {
    if (!this.config) {
      try {
        const configPath = path4.join(process.cwd(), "scraper.config.json");
        const configData = fs4.readFileSync(configPath, "utf-8");
        this.config = JSON.parse(configData);
        console.log("\u2713 Loaded scraper configuration from scraper.config.json");
      } catch (error) {
        console.warn("\u26A0\uFE0F  Could not load scraper.config.json, using defaults:", error instanceof Error ? error.message : error);
        this.config = {
          vpn: { enabled: false, changeAfterFailures: 5 },
          waitTimes: { scrollDelay: 1e3, minVariance: 2e3, maxVariance: 5e3 },
          scraping: { concurrency: 5, maxRetryRounds: 2, retryDelay: 5e3, detectEmptyResults: true },
          navigation: { timeout: 6e4, waitUntil: "domcontentloaded", maxConcurrentJobs: 3 },
          smartframe: { extractFullImages: false, viewportMode: "thumbnail", headless: false, renderTimeout: 5e3 }
        };
      }
    }
    if (!this.browser) {
      const launchOptions = {
        headless: true,
        // Default to headless, will restart if canvas extraction is needed
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled"
        ]
      };
      this.browser = await puppeteer.launch(launchOptions);
    }
    this.maxConcurrentJobs = this.config.navigation?.maxConcurrentJobs || 3;
    if (!this.vpnManager && this.config.vpn) {
      this.vpnManager = new VPNManager(this.config.vpn);
      if (this.config.vpn.enabled) {
        console.log("\u2713 VPN rotation enabled - will rotate after", this.config.vpn.changeAfterFailures, "consecutive failures");
      }
    }
    if (!this.waitTimeHelper && this.config.waitTimes) {
      this.waitTimeHelper = new WaitTimeHelper(this.config.waitTimes);
      console.log("\u2713 Random wait times enabled - base:", this.config.waitTimes.scrollDelay + "ms, variance:", this.config.waitTimes.minVariance + "-" + this.config.waitTimes.maxVariance + "ms");
    }
  }
  /**
   * Initialize SmartFrame extension if needed for canvas extraction
   */
  async ensureExtensionInitialized() {
    if (!this.extensionManager) {
      console.log("\u{1F3A8} Initializing SmartFrame canvas extraction extension...");
      this.extensionManager = new SmartFrameExtensionManager();
      this.extensionDir = await this.extensionManager.setupExtension();
      this.canvasExtractor = new SmartFrameCanvasExtractor();
      if (this.browser) {
        await this.browser.close();
      }
      const launchOptions = {
        headless: false,
        // Must be non-headless for canvas rendering
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
          `--disable-extensions-except=${this.extensionDir}`,
          `--load-extension=${this.extensionDir}`
        ]
      };
      this.browser = await puppeteer.launch(launchOptions);
      console.log("\u2713 Browser restarted with SmartFrame extension and non-headless mode");
    }
  }
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.extensionManager) {
      this.extensionManager.cleanup();
      this.extensionManager = null;
      this.extensionDir = null;
    }
  }
  /**
   * Process the next job in the queue
   */
  async processNextJob() {
    if (this.jobQueue.length === 0 || this.runningJobs >= this.maxConcurrentJobs) {
      return;
    }
    const job = this.jobQueue.shift();
    if (!job) return;
    this.runningJobs++;
    console.log(`
\u{1F4CA} Queue Status: ${this.runningJobs} running, ${this.jobQueue.length} queued`);
    try {
      const result = await this.scrapeInternal(job.jobId, job.url, job.config, job.callbacks);
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    } finally {
      this.runningJobs--;
      this.processNextJob();
    }
  }
  /**
   * Add a scrape job to the queue
   */
  async scrape(jobId, url, config, callbacks = {}) {
    return new Promise((resolve, reject) => {
      this.jobQueue.push({ jobId, url, config, callbacks, resolve, reject });
      console.log(`
\u{1F4E5} Job ${jobId} added to queue (position: ${this.jobQueue.length})`);
      this.processNextJob();
    });
  }
  /**
   * Internal scrape implementation (actual scraping logic)
   */
  async scrapeInternal(jobId, url, config, callbacks = {}) {
    await this.initialize();
    const canvasExtraction = config.canvasExtraction || "none";
    if (canvasExtraction !== "none") {
      await this.ensureExtensionInitialized();
    }
    const page = await this.browser.newPage();
    failedScrapesLogger.startJob(jobId);
    try {
      await storage.updateScrapeJob(jobId, { status: "scraping" });
      console.log("\n" + "=".repeat(60));
      console.log("STARTING SCRAPE JOB");
      console.log("=".repeat(60));
      console.log(`Job ID: ${jobId}`);
      console.log(`Target URL: ${url}`);
      console.log(`Max Images: ${config.maxImages === 0 ? "Unlimited" : config.maxImages}`);
      console.log(`Extract Details: ${config.extractDetails ? "Yes" : "No"}`);
      console.log(`Auto-scroll: ${config.autoScroll ? "Yes" : "No"}`);
      console.log(`Canvas Extraction: ${canvasExtraction}`);
      console.log("=".repeat(60) + "\n");
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br"
      });
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5]
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"]
        });
        window.chrome = {
          runtime: {}
        };
      });
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        request.continue();
      });
      page.on("response", async (response) => {
        const url2 = response.url();
        if (url2.includes("smartframe.") && (url2.includes("/api/") || url2.includes("/metadata") || url2.includes("/image/"))) {
          try {
            const contentType = response.headers()["content-type"];
            if (contentType && contentType.includes("application/json")) {
              const data = await response.json();
              if (data && (data.imageId || data.image_id || data.id)) {
                const imageId = data.imageId || data.image_id || data.id;
                metadataCache.set(imageId, data);
                console.log(`Cached metadata for image: ${imageId}`);
              }
            }
          } catch (error) {
          }
        }
      });
      console.log(`Navigating to ${url}...`);
      const navigationTimeout = this.config?.navigation?.timeout || 6e4;
      const waitUntil = this.config?.navigation?.waitUntil || "domcontentloaded";
      let attempts = 0;
      const maxAttempts = 3;
      let navigationSuccess = false;
      while (attempts < maxAttempts && !navigationSuccess) {
        attempts++;
        console.log(`Navigation attempt ${attempts}/${maxAttempts} to ${url}`);
        try {
          await page.goto(url, {
            waitUntil,
            timeout: navigationTimeout
          });
          navigationSuccess = true;
        } catch (error) {
          console.error(`Navigation attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) throw error;
          await this.waitTimeHelper.wait(2e3 * attempts);
        }
      }
      try {
        await page.waitForSelector('smartframe-embed, .sf-thumbnail, [data-testid="image-card"]', { timeout: 15e3 });
      } catch (error) {
        console.log("SmartFrame elements not found with standard selectors, trying fallback...");
        await this.waitTimeHelper.wait(3e3);
      }
      const thumbnails = await this.extractThumbnailsFromSearch(page);
      console.log(`Extracted ${thumbnails.size} thumbnails from search page`);
      const discoveredLinks = /* @__PURE__ */ new Map();
      console.log("Collecting images from initial page...");
      const initialPageLinks = await this.collectPageImageLinks(page);
      for (const link of initialPageLinks) {
        discoveredLinks.set(link.imageId, link);
      }
      console.log(`Initial page: collected ${discoveredLinks.size} images`);
      if (config.autoScroll) {
        await this.autoScroll(
          page,
          config.maxImages,
          config.scrollDelay || 1e3,
          async (progress) => {
            await storage.updateScrapeJob(jobId, {
              progress: Math.round(progress.percentage),
              scrapedImages: progress.current,
              totalImages: progress.total
            });
          },
          async () => {
            const pageLinks = await this.collectPageImageLinks(page);
            for (const link of pageLinks) {
              discoveredLinks.set(link.imageId, link);
            }
            console.log(`Collected ${discoveredLinks.size} unique images so far`);
          }
        );
      }
      const imageLinks = Array.from(discoveredLinks.values());
      console.log(`Total unique images collected: ${imageLinks.length}`);
      const limitedLinks = config.maxImages === 0 ? imageLinks : imageLinks.slice(0, config.maxImages);
      console.log(`Processing ${limitedLinks.length} image links`);
      const images = [];
      const concurrency = config.concurrency || this.config?.scraping?.concurrency || 2;
      console.log(`
\u{1F680} Parallel Processing Enabled: ${concurrency} concurrent tabs`);
      console.log(`Processing ${limitedLinks.length} images...
`);
      const processedImages = await this.processImagesInParallel(
        limitedLinks,
        thumbnails,
        config.extractDetails || false,
        concurrency,
        jobId,
        config,
        async (currentImages, attemptedCount) => {
          await storage.updateScrapeJob(jobId, {
            scrapedImages: currentImages.length,
            progress: Math.round(attemptedCount / limitedLinks.length * 100)
          });
          callbacks.onProgress?.(currentImages.length, limitedLinks.length);
        }
      );
      images.push(...processedImages);
      if (config.extractDetails) {
        const maxRetryRounds = this.config?.scraping?.maxRetryRounds || 2;
        console.log(`
\u{1F504} Starting retry mechanism (max ${maxRetryRounds} rounds)...`);
        for (let round = 1; round <= maxRetryRounds; round++) {
          const failures = failedScrapesLogger.getFailures();
          if (failures.length === 0) {
            console.log(`\u2705 No failed images to retry after round ${round - 1}`);
            break;
          }
          const retryableFailures = failures.filter((failure) => {
            if (failure.httpStatus === 404) {
              console.log(`\u23ED\uFE0F  Skipping retry for ${failure.imageId}: 404 Not Found`);
              return false;
            }
            if (failure.httpStatus === 403) {
              console.log(`\u23ED\uFE0F  Skipping retry for ${failure.imageId}: 403 Forbidden`);
              return false;
            }
            if (failure.httpStatus === 401) {
              console.log(`\u23ED\uFE0F  Skipping retry for ${failure.imageId}: 401 Unauthorized`);
              return false;
            }
            return true;
          });
          if (retryableFailures.length === 0) {
            console.log(`\u23ED\uFE0F  All ${failures.length} failures are non-retryable errors (404, 403, 401)`);
            break;
          }
          console.log(`
\u{1F504} Retry Round ${round}/${maxRetryRounds}: ${retryableFailures.length} retryable failures (${failures.length - retryableFailures.length} skipped as non-retryable)`);
          if (round > 1) {
            const delayBeforeRetry = 5e3 * round;
            console.log(`\u23F1\uFE0F  Waiting ${delayBeforeRetry}ms before retry round ${round}...`);
            await new Promise((resolve) => setTimeout(resolve, delayBeforeRetry));
          }
          const retriedImages = await this.retryFailedImages(
            retryableFailures,
            thumbnails,
            1,
            // Use concurrency of 1 for retries to minimize rate limiting
            jobId,
            round,
            config
          );
          images.push(...retriedImages);
          console.log(`\u2713 Retry round ${round} complete: ${retriedImages.length} images recovered`);
        }
        const finalFailures = failedScrapesLogger.getFailures();
        if (finalFailures.length > 0) {
          console.log(`
\u26A0\uFE0F  Final status: ${finalFailures.length} images could not be scraped after ${maxRetryRounds} retry rounds`);
        } else {
          console.log(`
\u2705 All images successfully scraped!`);
        }
      }
      await storage.updateScrapeJob(jobId, {
        status: "completed",
        completedAt: /* @__PURE__ */ new Date(),
        images,
        scrapedImages: images.length
      });
      console.log(`
\u2705 Job ${jobId} completed. Scraped ${images.length} images.`);
      callbacks.onComplete?.(images);
      return images;
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      await storage.updateScrapeJob(jobId, {
        status: "error",
        completedAt: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
      callbacks.onError?.(error);
      throw error;
    } finally {
      await page.close();
    }
  }
  async dismissCookieBanner(page) {
    try {
      const cookieSelector = this.config?.metadata?.cookieBannerSelector || ".cky-btn.cky-btn-accept";
      const cookieBanner = await page.$(cookieSelector);
      if (cookieBanner) {
        console.log("Cookie banner detected - dismissing...");
        await cookieBanner.click();
        await page.waitForSelector(cookieSelector, { hidden: true, timeout: 5e3 }).catch(() => {
        });
        console.log("Cookie banner dismissed successfully");
      }
    } catch (error) {
    }
  }
  /**
   * Content-aware wait: waits until a selector exists AND contains non-empty text
   * This ensures dynamic JavaScript has fully loaded metadata before extraction
   */
  async waitForContentLoaded(page, selector, timeoutMs = 15e3, description) {
    try {
      await page.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel);
          return element && element.textContent && element.textContent.trim().length > 0;
        },
        { timeout: timeoutMs },
        selector
      );
      console.log(`\u2713 ${description || selector} loaded with content`);
      return true;
    } catch (error) {
      console.log(`\u26A0\uFE0F  ${description || selector} loading timed out after ${timeoutMs}ms`);
      return false;
    }
  }
  /**
   * Extracts text content by piercing the Shadow DOM
   * Required for SmartFrame custom web components that encapsulate metadata
   */
  async extractFromShadowDOM(page, hostSelector, dataSelector) {
    return page.evaluate((hostSel, dataSel) => {
      const hostElement = document.querySelector(hostSel);
      if (hostElement && hostElement.shadowRoot) {
        const shadowRoot = hostElement.shadowRoot;
        const dataElement = shadowRoot.querySelector(dataSel);
        return dataElement ? dataElement.textContent : null;
      }
      return null;
    }, hostSelector, dataSelector);
  }
  /**
   * Waits for multiple metadata fields to be populated in Shadow DOM
   * Uses robust 15-second timeout to ensure dynamic content is fully loaded
   */
  async waitForMetadataFields(page, imageId) {
    const METADATA_TIMEOUT = this.config?.metadata?.metadataTimeout || 15e3;
    console.log(`[${imageId}] Waiting up to ${METADATA_TIMEOUT}ms for metadata to fully load...`);
    try {
      await page.waitForFunction(() => {
        const embed = document.querySelector("smartframe-embed");
        if (!embed || !embed.shadowRoot) return false;
        const shadowRoot = embed.shadowRoot;
        const listItems = shadowRoot.querySelectorAll("li");
        let fieldsWithContent = 0;
        listItems.forEach((li) => {
          const strong = li.querySelector("strong");
          if (strong) {
            const label = strong.textContent?.trim() || "";
            const value = strong.nextSibling?.textContent?.trim() || li.querySelector("button")?.textContent?.trim() || "";
            if (label && value && value.length > 0) {
              fieldsWithContent++;
            }
          }
        });
        return fieldsWithContent >= 3;
      }, { timeout: METADATA_TIMEOUT });
      console.log(`\u2713 [${imageId}] Metadata fields loaded successfully`);
    } catch (error) {
      console.log(`\u26A0\uFE0F  [${imageId}] Metadata loading timed out - proceeding with available data`);
    }
  }
  async processImagesInParallel(linkData, thumbnails, extractDetails, concurrency, jobId, config, onProgress) {
    const results = [];
    let attemptedCount = 0;
    const canvasExtraction = config.canvasExtraction || "none";
    if (canvasExtraction !== "none") {
      concurrency = 1;
      console.log(`\u{1F3A8} Canvas extraction enabled - using sequential processing (concurrency: 1) to ensure proper tab activation for GPU rendering`);
    }
    const workerPages = [];
    let viewport = { width: 1920, height: 1080 };
    if (canvasExtraction === "full") {
      viewport = { width: 9999, height: 9999 };
      console.log(`\u{1F4D0} Using full resolution viewport: ${viewport.width}x${viewport.height}`);
    } else if (canvasExtraction === "thumbnail") {
      viewport = { width: 600, height: 600 };
      console.log(`\u{1F4D0} Using thumbnail viewport: ${viewport.width}x${viewport.height}`);
    }
    for (let i = 0; i < concurrency; i++) {
      const workerPage = await this.browser.newPage();
      await workerPage.setViewport(viewport);
      await workerPage.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await workerPage.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br"
      });
      await workerPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
        window.chrome = { runtime: {} };
      });
      workerPages.push(workerPage);
    }
    try {
      if (canvasExtraction !== "none") {
        const workerPage = workerPages[0];
        for (let i = 0; i < linkData.length; i++) {
          const link = linkData[i];
          try {
            const image = await this.extractImageData(
              workerPage,
              link.url,
              link.imageId,
              link.hash,
              extractDetails,
              thumbnails.get(link.imageId),
              config
            );
            if (image) {
              console.log(`\u2713 [${i + 1}/${linkData.length}] ${link.imageId}`);
              results.push(image);
            }
          } catch (error) {
            console.error(`\u2717 Error scraping ${link.url}:`, error instanceof Error ? error.message : error);
            failedScrapesLogger.addFailure({
              imageId: link.imageId,
              url: link.url,
              reason: `Uncaught exception: ${error instanceof Error ? error.message : String(error)}`,
              attempts: 1,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
          attemptedCount++;
          await onProgress([...results], attemptedCount);
          if (i < linkData.length - 1) {
            await this.waitTimeHelper.wait(500);
          }
        }
      } else {
        const batchSize = concurrency;
        for (let i = 0; i < linkData.length; i += batchSize) {
          const batch = linkData.slice(i, i + batchSize);
          const batchPromises = batch.map(async (link, index3) => {
            const workerPage = workerPages[index3 % concurrency];
            try {
              const image = await this.extractImageData(
                workerPage,
                link.url,
                link.imageId,
                link.hash,
                extractDetails,
                thumbnails.get(link.imageId),
                config
              );
              if (image) {
                console.log(`\u2713 [${attemptedCount + 1}/${linkData.length}] ${link.imageId}`);
                return image;
              }
            } catch (error) {
              console.error(`\u2717 Error scraping ${link.url}:`, error instanceof Error ? error.message : error);
              failedScrapesLogger.addFailure({
                imageId: link.imageId,
                url: link.url,
                reason: `Uncaught exception: ${error instanceof Error ? error.message : String(error)}`,
                attempts: 1,
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
            return null;
          });
          const batchResults = await Promise.all(batchPromises);
          const validImages = batchResults.filter((img) => img !== null);
          results.push(...validImages);
          attemptedCount += batch.length;
          await onProgress([...results], attemptedCount);
          if (i + batchSize < linkData.length) {
            await this.waitTimeHelper.wait(500);
          }
        }
      }
    } finally {
      await Promise.all(workerPages.map((page) => page.close().catch(() => {
      })));
    }
    console.log(`
\u2705 Parallel processing complete: ${results.length} images extracted
`);
    return results;
  }
  async extractThumbnailsFromSearch(page) {
    const thumbnailMap = /* @__PURE__ */ new Map();
    try {
      const thumbnails = await page.evaluate(() => {
        const results = [];
        const embeds = document.querySelectorAll("smartframe-embed");
        embeds.forEach((embed) => {
          const imageId = embed.getAttribute("image-id");
          if (imageId) {
            const img = embed.querySelector("img");
            const thumbnailUrl = img?.src || "";
            if (thumbnailUrl) {
              results.push({ imageId, thumbnailUrl });
            }
          }
        });
        return results;
      });
      thumbnails.forEach(({ imageId, thumbnailUrl }) => {
        thumbnailMap.set(imageId, thumbnailUrl);
      });
    } catch (error) {
      console.error("Error extracting thumbnails:", error);
    }
    return thumbnailMap;
  }
  async collectPageImageLinks(page) {
    return await page.evaluate(() => {
      const links = [];
      const embeds = document.querySelectorAll("smartframe-embed");
      embeds.forEach((embed) => {
        const imageId = embed.getAttribute("image-id");
        const customerId = embed.getAttribute("customer-id");
        if (imageId && customerId) {
          links.push({
            url: `https://smartframe.com/search/image/${customerId}/${imageId}`,
            imageId,
            hash: customerId
          });
        }
      });
      const thumbnailLinks = document.querySelectorAll('a[href*="/search/image/"]');
      thumbnailLinks.forEach((link) => {
        const href = link.href;
        const match = href.match(/\/search\/image\/([^\/]+)\/([^\/\?]+)/);
        if (match && !links.some((l) => l.imageId === match[2])) {
          links.push({
            url: href,
            imageId: match[2],
            hash: match[1]
          });
        }
      });
      const containers = document.querySelectorAll("[data-image-id], .sf-thumbnail");
      containers.forEach((container) => {
        const imageId = container.getAttribute("data-image-id");
        const hash = container.getAttribute("data-customer-id") || container.getAttribute("data-hash");
        if (imageId && hash && !links.some((l) => l.imageId === imageId)) {
          links.push({
            url: `https://smartframe.com/search/image/${hash}/${imageId}`,
            imageId,
            hash
          });
        }
      });
      return links;
    });
  }
  async autoScroll(page, maxImages, scrollDelay, onProgress, onPageChange) {
    let previousHeight;
    let imageCount = 0;
    const loadedImageUrls = /* @__PURE__ */ new Set();
    const visitedPages = /* @__PURE__ */ new Set();
    let lastPageUrl = "";
    let justClickedPagination = false;
    const loadMoreSelectors = [
      '[data-testid="load-more"]',
      "button.load-more",
      "#load-more-button",
      'button[class*="load-more"]',
      'button[class*="rounded-r-md"]',
      // Next button in pagination (right-rounded button)
      '[aria-label*="Load"]',
      '[aria-label*="Next"]',
      '[aria-label*="next"]',
      ".pagination button",
      ".pagination a",
      "nav button",
      "nav a",
      "button",
      // Fallback: check all buttons
      'a[href*="page"]'
      // Links with "page" in href
    ];
    const isUnlimited = maxImages === 0;
    const patienceRounds = 5;
    const patienceDelay = scrollDelay * 2;
    console.log(`Starting auto-scroll (target: ${isUnlimited ? "unlimited" : maxImages} images, delay: ${scrollDelay}ms, patience: ${patienceRounds} rounds)`);
    while (isUnlimited || imageCount < maxImages) {
      const currentUrl = page.url();
      const currentPageKey = currentUrl + "-" + imageCount;
      if (!justClickedPagination && visitedPages.has(currentPageKey)) {
        console.log(`Already visited page state: ${currentPageKey}. Breaking pagination loop.`);
        break;
      }
      justClickedPagination = false;
      visitedPages.add(currentPageKey);
      const thumbnails = await page.$$("img");
      imageCount = thumbnails.length;
      console.log(`Scrolled to ${await page.evaluate(() => document.body.scrollHeight)}px, found ${imageCount} images`);
      onProgress({
        percentage: isUnlimited ? 0 : imageCount / maxImages * 100,
        current: imageCount,
        total: isUnlimited ? imageCount : maxImages,
        status: "Scrolling and discovering images..."
      });
      let loadMoreButton = null;
      let matchedSelector = "";
      let buttonText = "";
      try {
        const buttonInfo = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button, a"));
          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const text3 = btn.textContent?.toLowerCase().trim() || "";
            const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
            if (text3 === "next" || ariaLabel === "next" || text3.startsWith("next")) {
              const isDisabled = btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true";
              if (isDisabled) continue;
              const rect = btn.getBoundingClientRect();
              const isVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) * 2 && rect.right <= (window.innerWidth || document.documentElement.clientWidth) && rect.width > 0 && rect.height > 0;
              if (isVisible && btn instanceof HTMLElement) {
                const style = window.getComputedStyle(btn);
                if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                  return {
                    found: true,
                    index: i,
                    text: btn.textContent?.trim() || "",
                    tagName: btn.tagName.toLowerCase()
                  };
                }
              }
            }
          }
          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            const text3 = btn.textContent?.toLowerCase() || "";
            const classList = Array.from(btn.classList || []);
            const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
            const isPaginationText = text3.includes("load more") || text3.includes("show more") || text3.includes("load all");
            const isPaginationClass = classList.some(
              (cls) => cls.includes("load") || cls.includes("pagination") || cls.includes("rounded-r-md")
              // Specific to Next button in the provided HTML
            );
            const isPaginationAria = ariaLabel.includes("load") || ariaLabel.includes("more");
            if (isPaginationText || isPaginationClass || isPaginationAria) {
              const isDisabled = btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true";
              if (isDisabled) continue;
              const rect = btn.getBoundingClientRect();
              const isVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) * 2 && rect.right <= (window.innerWidth || document.documentElement.clientWidth) && rect.width > 0 && rect.height > 0;
              if (isVisible && btn instanceof HTMLElement) {
                const style = window.getComputedStyle(btn);
                if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                  return {
                    found: true,
                    index: i,
                    text: btn.textContent?.trim() || "",
                    tagName: btn.tagName.toLowerCase()
                  };
                }
              }
            }
          }
          return { found: false };
        });
        if (buttonInfo.found) {
          const allButtons = await page.$$("button, a");
          if (buttonInfo.index !== void 0 && allButtons[buttonInfo.index]) {
            loadMoreButton = allButtons[buttonInfo.index];
            matchedSelector = "evaluated pagination button";
            buttonText = buttonInfo.text || "";
            console.log(`Found pagination button with text: "${buttonText}"`);
          }
        }
      } catch (error) {
        console.log("Error finding pagination button via evaluation:", error);
      }
      if (!loadMoreButton) {
        for (const selector of loadMoreSelectors) {
          try {
            const elements = await page.$$(selector);
            for (const element of elements) {
              const isVisible = await element.isIntersectingViewport();
              if (isVisible) {
                const isDisabled = await element.evaluate((el) => {
                  return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
                });
                if (isDisabled) continue;
                const text3 = await element.evaluate((el) => el.textContent?.toLowerCase().trim() || "");
                const isPagination = text3 === "next" || text3.includes("load") || text3.includes("more") || text3.includes("next") || text3.includes("show");
                if (isPagination) {
                  loadMoreButton = element;
                  matchedSelector = selector;
                  buttonText = text3;
                  console.log(`Found pagination button with selector: ${selector}, text: "${text3}"`);
                  break;
                }
              }
            }
            if (loadMoreButton) break;
          } catch (error) {
          }
        }
      }
      if (loadMoreButton) {
        try {
          const beforeClickImageCount = imageCount;
          const beforeClickUrl = page.url();
          await loadMoreButton.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
          await new Promise((resolve) => setTimeout(resolve, 500));
          await loadMoreButton.click();
          console.log(`Clicked pagination button (${matchedSelector}).`);
          await new Promise((resolve) => setTimeout(resolve, scrollDelay + 2e3));
          const afterClickUrl = page.url();
          const afterClickThumbnails = await page.$$("img");
          const afterClickImageCount = afterClickThumbnails.length;
          if (afterClickUrl !== beforeClickUrl) {
            console.log(`Page URL changed from ${beforeClickUrl} to ${afterClickUrl} - pagination successful`);
            lastPageUrl = afterClickUrl;
            justClickedPagination = true;
            if (onPageChange) await onPageChange();
            continue;
          } else if (afterClickImageCount > beforeClickImageCount) {
            console.log(`Image count increased from ${beforeClickImageCount} to ${afterClickImageCount} - pagination successful`);
            justClickedPagination = true;
            if (onPageChange) await onPageChange();
            continue;
          } else {
            console.log(`Click did not result in page change or new content. Proceeding with scroll.`);
            loadMoreButton = null;
          }
        } catch (error) {
          console.log("Pagination button no longer clickable or disappeared. Proceeding with scroll.");
          loadMoreButton = null;
        }
      }
      previousHeight = await page.evaluate(() => document.body.scrollHeight);
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await new Promise((resolve) => setTimeout(resolve, scrollDelay));
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) {
        console.log("Scroll height unchanged. Checking for pagination button before patience mechanism...");
        let paginationButton = null;
        let paginationSelector = "";
        let paginationButtonText = "";
        try {
          const buttonInfo = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button, a"));
            for (let i = 0; i < buttons.length; i++) {
              const btn = buttons[i];
              const text3 = btn.textContent?.toLowerCase().trim() || "";
              const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
              if (text3 === "next" || ariaLabel === "next" || text3.startsWith("next")) {
                const isDisabled = btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true";
                if (isDisabled) continue;
                const rect = btn.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) * 2 && rect.right <= (window.innerWidth || document.documentElement.clientWidth) && rect.width > 0 && rect.height > 0;
                if (isVisible && btn instanceof HTMLElement) {
                  const style = window.getComputedStyle(btn);
                  if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                    return {
                      found: true,
                      index: i,
                      text: btn.textContent?.trim() || "",
                      tagName: btn.tagName.toLowerCase()
                    };
                  }
                }
              }
            }
            for (let i = 0; i < buttons.length; i++) {
              const btn = buttons[i];
              const text3 = btn.textContent?.toLowerCase() || "";
              const classList = Array.from(btn.classList || []);
              const ariaLabel = btn.getAttribute("aria-label")?.toLowerCase() || "";
              const isPaginationText = text3.includes("load more") || text3.includes("show more") || text3.includes("load all");
              const isPaginationClass = classList.some(
                (cls) => cls.includes("load") || cls.includes("pagination") || cls.includes("rounded-r-md")
              );
              const isPaginationAria = ariaLabel.includes("load") || ariaLabel.includes("more");
              if (isPaginationText || isPaginationClass || isPaginationAria) {
                const isDisabled = btn.hasAttribute("disabled") || btn.getAttribute("aria-disabled") === "true";
                if (isDisabled) continue;
                const rect = btn.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) * 2 && rect.right <= (window.innerWidth || document.documentElement.clientWidth) && rect.width > 0 && rect.height > 0;
                if (isVisible && btn instanceof HTMLElement) {
                  const style = window.getComputedStyle(btn);
                  if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                    return {
                      found: true,
                      index: i,
                      text: btn.textContent?.trim() || "",
                      tagName: btn.tagName.toLowerCase()
                    };
                  }
                }
              }
            }
            return { found: false };
          });
          if (buttonInfo.found) {
            const allButtons = await page.$$("button, a");
            if (buttonInfo.index !== void 0 && allButtons[buttonInfo.index]) {
              paginationButton = allButtons[buttonInfo.index];
              paginationSelector = "evaluated pagination button";
              paginationButtonText = buttonInfo.text || "";
              console.log(`Found pagination button at bottom with text: "${paginationButtonText}"`);
            }
          }
        } catch (error) {
          console.log("Error finding pagination button at bottom:", error);
        }
        if (!paginationButton) {
          for (const selector of loadMoreSelectors) {
            try {
              const elements = await page.$$(selector);
              for (const element of elements) {
                const isVisible = await element.isIntersectingViewport();
                if (isVisible) {
                  const isDisabled = await element.evaluate((el) => {
                    return el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
                  });
                  if (isDisabled) continue;
                  const text3 = await element.evaluate((el) => el.textContent?.toLowerCase().trim() || "");
                  const isPagination = text3 === "next" || text3.includes("load") || text3.includes("more") || text3.includes("next") || text3.includes("show");
                  if (isPagination) {
                    paginationButton = element;
                    paginationSelector = selector;
                    paginationButtonText = text3;
                    console.log(`Found pagination button at bottom with selector: ${selector}, text: "${text3}"`);
                    break;
                  }
                }
              }
              if (paginationButton) break;
            } catch (error) {
            }
          }
        }
        if (paginationButton) {
          try {
            const beforeClickImageCount = imageCount;
            const beforeClickUrl = page.url();
            await paginationButton.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
            await this.waitTimeHelper.wait(500);
            await paginationButton.click();
            console.log(`Clicked pagination button at bottom (${paginationSelector}).`);
            await this.waitTimeHelper.wait(scrollDelay + 2e3);
            const afterClickUrl = page.url();
            const afterClickThumbnails = await page.$$("img");
            const afterClickImageCount = afterClickThumbnails.length;
            if (afterClickUrl !== beforeClickUrl) {
              console.log(`Page URL changed after click at bottom - pagination successful`);
              lastPageUrl = afterClickUrl;
              justClickedPagination = true;
              if (onPageChange) await onPageChange();
              continue;
            } else if (afterClickImageCount > beforeClickImageCount) {
              console.log(`Image count increased after click at bottom - pagination successful`);
              justClickedPagination = true;
              if (onPageChange) await onPageChange();
              continue;
            } else {
              console.log(`Click at bottom did not result in page change. Proceeding with patience mechanism.`);
            }
          } catch (error) {
            console.log("Failed to click pagination button at bottom. Proceeding with patience mechanism.");
          }
        }
        console.log("No pagination button found. Starting patience mechanism...");
        let moreImagesLoaded = false;
        for (let round = 1; round <= patienceRounds; round++) {
          console.log(`Patience round ${round}/${patienceRounds}: Waiting ${patienceDelay}ms for more images to load...`);
          await this.waitTimeHelper.wait(patienceDelay);
          const currentHeight = await page.evaluate(() => document.body.scrollHeight);
          if (currentHeight > newHeight) {
            console.log(`Patience round ${round}/${patienceRounds}: New content detected! Scroll height increased from ${newHeight}px to ${currentHeight}px.`);
            moreImagesLoaded = true;
            break;
          }
          console.log(`Patience round ${round}/${patienceRounds}: No new content yet (height still ${currentHeight}px).`);
        }
        if (!moreImagesLoaded) {
          console.log(`Patience mechanism exhausted after ${patienceRounds} rounds. Reached end of page.`);
          break;
        }
      }
    }
  }
  // Helper function to clean and validate extracted text (plain JS for serialization)
  cleanTextHelper(text3) {
    if (!text3) return null;
    const lowerText = text3.toLowerCase();
    if (lowerText.includes("script") || lowerText.includes("iframe") || lowerText.includes("onclick") || lowerText.includes("onerror") || lowerText.includes("onload")) return null;
    if (lowerText.includes("add to board") || lowerText.includes("copy link") || lowerText.includes("copy embed") || lowerText.includes("google tag manager") || lowerText.includes("smartframe content partner")) return null;
    let cleaned = text3;
    cleaned = cleaned.replace(/<[^>]*>/g, "");
    cleaned = cleaned.replace(/^<[^>]*/, "").replace(/[^<]*>$/, "");
    cleaned = cleaned.replace(/[<>]/g, "");
    cleaned = cleaned.trim();
    if (cleaned.length > 200) return null;
    if (cleaned.split("\n").length > 3) return null;
    return cleaned || null;
  }
  isEmptyResult(image) {
    const meaningfulFields = [
      image.photographer,
      image.imageSize,
      image.fileSize,
      image.country,
      image.city,
      image.date,
      image.matchEvent,
      image.title,
      image.caption,
      image.captionRaw,
      image.featuring,
      image.comments,
      image.copyright,
      image.dateTaken,
      image.authors,
      image.contentPartner
    ];
    const hasNoTags = !image.tags || image.tags.length === 0;
    return meaningfulFields.every((field) => field === null || field === void 0 || field === "") && hasNoTags;
  }
  async retryFailedImages(failures, thumbnails, concurrency, jobId, retryRound = 1, config) {
    const results = [];
    let successCount = 0;
    let failCount = 0;
    console.log(`Starting retry round ${retryRound} with concurrency: ${concurrency}`);
    const retryableFailures = failures.filter((failure) => {
      if (failure.httpStatus === 404) {
        console.log(`\u23ED\uFE0F  Skipping ${failure.imageId} - HTTP 404 (not retryable)`);
        return false;
      }
      if (failure.httpStatus === 403) {
        console.log(`\u23ED\uFE0F  Skipping ${failure.imageId} - HTTP 403 Forbidden (not retryable)`);
        return false;
      }
      if (failure.httpStatus === 401) {
        console.log(`\u23ED\uFE0F  Skipping ${failure.imageId} - HTTP 401 Unauthorized (not retryable)`);
        return false;
      }
      return true;
    });
    if (retryableFailures.length < failures.length) {
      console.log(`\u{1F4CA} Filtered out ${failures.length - retryableFailures.length} non-retryable errors`);
    }
    if (retryableFailures.length === 0) {
      console.log("No retryable failures found");
      return results;
    }
    const workerPages = [];
    const canvasExtraction = config.canvasExtraction || "none";
    let viewport = { width: 1920, height: 1080 };
    if (canvasExtraction === "full") {
      viewport = { width: 9999, height: 9999 };
    } else if (canvasExtraction === "thumbnail") {
      viewport = { width: 600, height: 600 };
    }
    for (let i = 0; i < concurrency; i++) {
      const workerPage = await this.browser.newPage();
      await workerPage.setViewport(viewport);
      await workerPage.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await workerPage.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br"
      });
      await workerPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
        window.chrome = { runtime: {} };
      });
      workerPages.push(workerPage);
    }
    try {
      const batchSize = concurrency;
      for (let i = 0; i < retryableFailures.length; i += batchSize) {
        const batch = retryableFailures.slice(i, i + batchSize);
        const batchPromises = batch.map(async (failure, index3) => {
          const workerPage = workerPages[index3 % concurrency];
          const retryAttempt = (failure.retryAttempt || 0) + 1;
          console.log(`\u{1F504} [Round ${retryRound}, Retry ${retryAttempt}] Attempting ${failure.imageId} (${i + index3 + 1}/${retryableFailures.length})`);
          try {
            const urlMatch = failure.url.match(/\/search\/image\/([^\/]+)\/([^\/\?]+)/);
            const hash = urlMatch ? urlMatch[1] : "";
            const image = await this.extractImageData(
              workerPage,
              failure.url,
              failure.imageId,
              hash,
              true,
              // extractDetails is always true for retries
              thumbnails.get(failure.imageId),
              config
            );
            if (image && (image.title || image.photographer || image.caption)) {
              console.log(`\u2705 [Round ${retryRound}, Retry ${retryAttempt}] Success: ${failure.imageId}`);
              failedScrapesLogger.removeSuccess(failure.imageId);
              successCount++;
              return image;
            } else {
              console.log(`\u274C [Round ${retryRound}, Retry ${retryAttempt}] Still no data: ${failure.imageId}`);
              failedScrapesLogger.addFailure({
                imageId: failure.imageId,
                url: failure.url,
                reason: `${failure.reason} (retry round ${retryRound}, attempt ${retryAttempt} failed)`,
                attempts: failure.attempts + 1,
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                httpStatus: failure.httpStatus,
                retryAttempt
              });
              failCount++;
            }
          } catch (error) {
            console.error(`\u274C [Round ${retryRound}, Retry ${retryAttempt}] Exception for ${failure.imageId}:`, error instanceof Error ? error.message : error);
            failedScrapesLogger.addFailure({
              imageId: failure.imageId,
              url: failure.url,
              reason: `Retry round ${retryRound}, attempt ${retryAttempt} exception: ${error instanceof Error ? error.message : String(error)}`,
              attempts: failure.attempts + 1,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              httpStatus: failure.httpStatus,
              retryAttempt
            });
            failCount++;
          }
          return null;
        });
        const batchResults = await Promise.all(batchPromises);
        const validImages = batchResults.filter((img) => img !== null);
        results.push(...validImages);
        if (i + batchSize < retryableFailures.length) {
          const delayBetweenBatches = 3e3 * retryRound;
          console.log(`\u23F3 Waiting ${delayBetweenBatches / 1e3}s before next batch...`);
          await this.waitTimeHelper.wait(delayBetweenBatches);
        }
      }
    } finally {
      await Promise.all(workerPages.map((page) => page.close().catch(() => {
      })));
    }
    console.log(`
\u{1F4CA} Retry Round ${retryRound} Summary:`);
    console.log(`   \u2705 Successful: ${successCount}`);
    console.log(`   \u274C Failed: ${failCount}`);
    console.log(`   \u{1F4C8} Recovery rate: ${retryableFailures.length > 0 ? (successCount / retryableFailures.length * 100).toFixed(1) : 0}%
`);
    return results;
  }
  parseMetadata(rawData) {
    const result = {
      photographer: null,
      imageSize: null,
      fileSize: null,
      country: null,
      city: null,
      date: null,
      matchEvent: null,
      title: null,
      caption: null,
      captionRaw: null,
      featuring: null,
      tags: [],
      comments: null,
      copyright: null,
      dateTaken: null,
      authors: null,
      contentPartner: null
    };
    const title = this.cleanTextHelper(rawData.title);
    const captionText = rawData.caption ? rawData.caption.trim() : null;
    result.title = title;
    result.captionRaw = captionText;
    result.comments = captionText;
    if (rawData.contentPartner) {
      result.contentPartner = this.cleanTextHelper(rawData.contentPartner);
    }
    if (rawData.keywords && Array.isArray(rawData.keywords)) {
      result.tags = rawData.keywords.map((k) => this.cleanTextHelper(k)).filter(Boolean);
    }
    for (const item of rawData.labelValues || []) {
      const label = item.label?.toLowerCase() || "";
      const value = this.cleanTextHelper(item.value);
      if (!value) continue;
      switch (label) {
        case "photographer":
        case "credit":
        case "photo credit":
        case "by":
        case "author":
        case "shot by":
        case "photo by":
          result.photographer = result.photographer || value;
          result.authors = result.authors || value;
          if (value.includes("\xA9") || value.includes("Copyright")) {
            result.copyright = result.copyright || value;
          }
          break;
        case "image size":
        case "size":
        case "dimensions":
        case "resolution":
          result.imageSize = result.imageSize || value;
          break;
        case "file size":
        case "filesize":
          result.fileSize = result.fileSize || value;
          break;
        case "country":
        case "nation":
          result.country = result.country || value;
          break;
        case "city":
        case "location":
        case "place":
        case "where":
          result.city = result.city || value;
          break;
        case "date":
        case "date taken":
        case "when":
        case "date created":
        case "created":
          if (!result.date) {
            result.date = value;
            result.dateTaken = normalizeDate(value) || value;
          }
          break;
        case "event":
        case "title":
        case "headline":
        case "event title":
          result.title = result.title || value;
          result.matchEvent = result.matchEvent || value;
          break;
        case "caption":
        case "description":
        case "desc":
          result.comments = result.comments || value;
          break;
        case "featuring":
        case "people":
        case "subject":
        case "subjects":
        case "person":
        case "who":
          result.featuring = result.featuring || value;
          break;
        case "tags":
        case "keywords":
        case "keyword":
          if (value) {
            result.tags = value.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
          }
          break;
        case "copyright":
        case "\xA9":
        case "rights":
          result.copyright = result.copyright || value;
          break;
        default:
          break;
      }
    }
    result.title = result.title || title;
    result.matchEvent = result.matchEvent || result.title || captionText;
    if (captionText) {
      const lines = captionText.split("\n").map((l) => l.trim()).filter(Boolean);
      const creditMatch = captionText.match(/(?:Credit|Photographer|Photo(?:\s+Credit)?|©|Copyright)(?:\s*\([^)]+\))?:\s*([^\n]+)/i);
      if (creditMatch) {
        const credit = this.cleanTextHelper(creditMatch[1]);
        if (credit) {
          let cleanedCredit = credit;
          cleanedCredit = cleanedCredit.replace(/^\s*\([^)]+\)\s*:\s*/, "").trim();
          cleanedCredit = cleanedCredit.replace(/^:\s*/, "").trim();
          if (cleanedCredit && cleanedCredit.length > 0) {
            result.photographer = result.photographer || cleanedCredit;
            result.authors = result.authors || cleanedCredit;
            result.copyright = result.copyright || cleanedCredit;
          }
        }
      }
      for (const line of lines) {
        const locationDateMatch = line.match(/^(.+?)\s+[-–]\s+(\d{2}\.\d{2}\.\d{2,4})$/);
        if (locationDateMatch && !result.date) {
          const locationPart = locationDateMatch[1].trim();
          const datePart = locationDateMatch[2].trim();
          const looksLikeLocation = (() => {
            const lowerLocation = locationPart.toLowerCase();
            const nonLocationWords = ["the", "crew", "team", "squad", "group", "cast", "staff", "members", "players", "fans", "crowd", "audience"];
            if (nonLocationWords.some((word) => lowerLocation.includes(` ${word} `) || lowerLocation.startsWith(`${word} `) || lowerLocation.endsWith(` ${word}`))) {
              return false;
            }
            if (locationPart.includes(",")) return true;
            const words = locationPart.split(/\s+/);
            const capitalizedWords = words.filter((word) => /^[A-Z]/.test(word));
            if (capitalizedWords.length >= words.length * 0.5) return true;
            const locationKeywords = ["street", "avenue", "road", "boulevard", "center", "centre", "stadium", "arena", "park", "hall", "square", "building"];
            if (locationKeywords.some((keyword) => lowerLocation.includes(keyword))) return true;
            return false;
          })();
          if (looksLikeLocation) {
            if (locationPart.includes(",")) {
              const parts = locationPart.split(",").map((p) => p.trim());
              result.city = result.city || this.cleanTextHelper(parts[0]);
              result.country = result.country || this.cleanTextHelper(parts.slice(1).join(", "));
            } else {
              result.city = result.city || this.cleanTextHelper(locationPart);
            }
            result.date = datePart;
            result.dateTaken = normalizeDate(datePart) || datePart;
            console.log(`[Metadata] Extracted embedded location/date: ${locationPart} - ${datePart}`);
          } else {
            console.log(`[Metadata] Skipped non-location line: ${locationPart} - ${datePart}`);
          }
        }
      }
      const whereMatch = captionText.match(/Where:\s*([^\n]+)/i);
      if (whereMatch) {
        const location = this.cleanTextHelper(whereMatch[1]);
        if (location) {
          if (location.includes(",")) {
            const parts = location.split(",").map((p) => p.trim());
            result.city = result.city || this.cleanTextHelper(parts[0]);
            result.country = result.country || this.cleanTextHelper(parts.slice(1).join(", "));
          } else {
            result.city = result.city || location;
          }
        }
      }
      const whenMatch = captionText.match(/When:\s*([^\n]+)/i);
      if (whenMatch && !result.date) {
        const dateValue = this.cleanTextHelper(whenMatch[1]);
        result.date = dateValue;
        result.dateTaken = normalizeDate(dateValue) || dateValue;
      }
      if (!result.title && lines.length > 0) {
        const isProviderSlug = (text3) => {
          const knownProviders = [
            /^(WENN|Getty|AFP|Reuters|AP|Press Association|PA|Shutterstock|Alamy|Corbis)$/i,
            /^(WireImage|FilmMagic|GC Images|Splash News|DPA|EPA|Xinhua|Sipa)$/i
          ];
          if (knownProviders.some((pattern) => pattern.test(text3.trim()))) {
            return true;
          }
          const words = text3.trim().split(/\s+/);
          if (words.length <= 3 && text3 === text3.toUpperCase() && /^[A-Z]/.test(text3)) {
            return true;
          }
          return false;
        };
        let titleLine = lines[0];
        let titleIndex = 0;
        while (titleIndex < lines.length) {
          titleLine = lines[titleIndex];
          if (titleLine.includes("Credit:") || titleLine.includes("Where:") || titleLine.includes("When:") || titleLine.match(/^.+?\s+[-–]\s+\d{2}\.\d{2}/)) {
            titleIndex++;
            continue;
          }
          if (isProviderSlug(titleLine)) {
            titleIndex++;
            continue;
          }
          break;
        }
        if (titleIndex < lines.length && titleLine) {
          const cleanedTitleLine = this.cleanTextHelper(titleLine);
          if (cleanedTitleLine) {
            result.title = cleanedTitleLine;
          }
        }
      }
      if (!result.title) {
        result.title = result.matchEvent || result.captionRaw;
      }
      const featuringMatch = captionText.match(/Featuring:\s*([^\n]+)/i);
      if (featuringMatch) {
        result.featuring = result.featuring || this.cleanTextHelper(featuringMatch[1]);
      }
    }
    if (rawData.nextData) {
      result.photographer = result.photographer || this.cleanTextHelper(rawData.nextData.photographer);
      result.authors = result.authors || result.photographer;
      result.imageSize = result.imageSize || this.cleanTextHelper(rawData.nextData.dimensions);
      result.fileSize = result.fileSize || this.cleanTextHelper(rawData.nextData.fileSize);
      result.country = result.country || this.cleanTextHelper(rawData.nextData.country);
      result.city = result.city || this.cleanTextHelper(rawData.nextData.city);
      if (!result.date) {
        const dateValue = this.cleanTextHelper(rawData.nextData.date);
        result.date = dateValue;
        result.dateTaken = normalizeDate(dateValue) || dateValue;
      }
      result.title = result.title || this.cleanTextHelper(rawData.nextData.title || rawData.nextData.eventTitle);
      result.matchEvent = result.matchEvent || result.title;
      result.featuring = result.featuring || this.cleanTextHelper(rawData.nextData.featuring || rawData.nextData.people);
      result.copyright = result.copyright || this.cleanTextHelper(rawData.nextData.copyright);
      result.contentPartner = result.contentPartner || this.cleanTextHelper(rawData.nextData.contentPartner || rawData.nextData.provider);
      if (rawData.nextData.tags && Array.isArray(rawData.nextData.tags)) {
        result.tags = [.../* @__PURE__ */ new Set([...result.tags || [], ...rawData.nextData.tags.map((t) => String(t).trim()).filter(Boolean)])];
      }
    }
    if (result.date && !result.dateTaken) {
      result.dateTaken = normalizeDate(result.date) || result.date;
    }
    result.caption = generateCaption({
      title: result.title,
      captionRaw: result.captionRaw,
      featuring: result.featuring,
      city: result.city,
      country: result.country,
      dateTaken: result.dateTaken,
      photographer: result.photographer,
      copyright: result.copyright
    });
    return result;
  }
  async extractImageData(page, url, imageId, hash, extractDetails, thumbnailUrl, config) {
    const image = {
      imageId,
      hash,
      url,
      copyLink: url,
      smartframeId: imageId,
      photographer: null,
      imageSize: null,
      fileSize: null,
      country: null,
      city: null,
      date: null,
      matchEvent: null,
      thumbnailUrl: thumbnailUrl || null,
      title: null,
      caption: null,
      captionRaw: null,
      featuring: null,
      tags: [],
      comments: null,
      copyright: null,
      dateTaken: null,
      authors: null,
      contentPartner: null
    };
    if (metadataCache.has(imageId)) {
      const cachedData = metadataCache.get(imageId);
      console.log(`Using cached network metadata for ${imageId}`);
      image.photographer = cachedData.photographer || cachedData.credit || cachedData.author || null;
      image.imageSize = cachedData.dimensions || cachedData.size || cachedData.imageSize || null;
      image.fileSize = cachedData.fileSize || cachedData.file_size || null;
      image.country = cachedData.country || cachedData.location?.country || null;
      image.city = cachedData.city || cachedData.location?.city || null;
      image.date = cachedData.date || cachedData.dateCreated || cachedData.created_at || null;
      image.matchEvent = cachedData.title || cachedData.event || cachedData.description || null;
      image.title = cachedData.title || cachedData.headline || null;
      image.captionRaw = cachedData.description || cachedData.caption || null;
      image.featuring = cachedData.featuring || cachedData.people || cachedData.subject || null;
      image.comments = image.captionRaw;
      image.copyright = cachedData.copyright || cachedData.credit || null;
      image.authors = image.photographer;
      if (cachedData.tags && Array.isArray(cachedData.tags)) {
        image.tags = cachedData.tags.map((t) => String(t).trim()).filter(Boolean);
      }
      if (image.date) {
        image.dateTaken = normalizeDate(image.date);
      }
    }
    if (extractDetails) {
      try {
        await page.setViewport({ width: 1280, height: 800 });
        const canvasExtraction2 = config.canvasExtraction || "none";
        if (canvasExtraction2 !== "none" && this.canvasExtractor) {
          await this.canvasExtractor.setupShadowRootCapture(page, imageId);
        }
        let navSuccess = false;
        let httpStatus = 0;
        let lastError = null;
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 3e4 });
            httpStatus = response?.status() || 0;
            if (httpStatus === 429) {
              console.log(`\u26A0\uFE0F  [${imageId}] HTTP 429 - Rate limited (attempt ${attempt}/${maxAttempts})`);
              if (attempt < maxAttempts) {
                const delay = 5e3 * Math.pow(2, attempt - 1);
                console.log(`Rate limited. Waiting ${delay}ms before retry...`);
                await this.waitTimeHelper.wait(delay);
                continue;
              } else {
                console.log(`\u274C [${imageId}] Failed after ${attempt} attempts - HTTP 429 Rate Limited. Logging failure.`);
                failedScrapesLogger.addFailure({
                  imageId,
                  url,
                  reason: `HTTP 429 Rate Limited after ${maxAttempts} attempts`,
                  attempts: maxAttempts,
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  httpStatus
                });
                return image;
              }
            } else if (httpStatus >= 500) {
              console.log(`\u26A0\uFE0F  [${imageId}] HTTP ${httpStatus} error - Server error (attempt ${attempt}/${maxAttempts})`);
              if (attempt < maxAttempts) {
                const delay = 2e3 * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${delay}ms...`);
                await this.waitTimeHelper.wait(delay);
                continue;
              } else {
                console.log(`\u274C [${imageId}] Failed after ${attempt} attempts - HTTP ${httpStatus}. Logging failure.`);
                failedScrapesLogger.addFailure({
                  imageId,
                  url,
                  reason: `HTTP ${httpStatus} Server Error after ${maxAttempts} attempts`,
                  attempts: maxAttempts,
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  httpStatus
                });
                return image;
              }
            } else if (httpStatus === 404) {
              console.log(`\u274C [${imageId}] HTTP 404 - Image not found. Logging failure.`);
              failedScrapesLogger.addFailure({
                imageId,
                url,
                reason: "HTTP 404 - Image Not Found",
                attempts: attempt,
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                httpStatus
              });
              return image;
            } else if (httpStatus >= 400) {
              console.log(`\u26A0\uFE0F  [${imageId}] HTTP ${httpStatus} error - Client error. Logging failure.`);
              failedScrapesLogger.addFailure({
                imageId,
                url,
                reason: `HTTP ${httpStatus} Client Error`,
                attempts: attempt,
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                httpStatus
              });
              return image;
            }
            navSuccess = true;
            await this.dismissCookieBanner(page);
            break;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.log(`Navigation attempt ${attempt} failed for ${url}:`, error instanceof Error ? error.message : error);
            if (attempt === maxAttempts) {
              console.log(`\u274C [${imageId}] Failed to navigate after ${maxAttempts} attempts. Logging failure.`);
              failedScrapesLogger.addFailure({
                imageId,
                url,
                reason: `Navigation timeout: ${lastError.message}`,
                attempts: maxAttempts,
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              });
              return image;
            }
            const delay = 2e3 * Math.pow(2, attempt - 1);
            console.log(`Retrying in ${delay}ms...`);
            await this.waitTimeHelper.wait(delay);
          }
        }
        if (!navSuccess) return image;
        console.log(`[${imageId}] Waiting for dynamic content to load...`);
        try {
          await page.waitForSelector("smartframe-embed", { timeout: 15e3 });
          console.log(`[${imageId}] smartframe-embed found`);
        } catch (error) {
          console.log(`[${imageId}] smartframe-embed not found within 15s - will try extraction anyway`);
        }
        await this.waitForMetadataFields(page, imageId);
        const rawData = await page.evaluate(() => {
          const labelValues = [];
          const keywords = [];
          const embed = document.querySelector("smartframe-embed");
          let shadowRoot = null;
          if (embed) {
            shadowRoot = embed.shadowRoot;
            if (!shadowRoot) {
              console.log("[Extraction] smartframe-embed found but shadowRoot is null");
            } else {
              console.log("[Extraction] smartframe-embed shadowRoot accessed successfully");
            }
          } else {
            console.log("[Extraction] smartframe-embed element not found");
          }
          let title = null;
          let caption = null;
          let contentPartner = null;
          if (shadowRoot) {
            const shadowTitle = shadowRoot.querySelector('h1, h2, [class*="title"], [data-title]');
            title = shadowTitle?.textContent || null;
            const shadowCaption = shadowRoot.querySelector('p, div[class*="caption"], [class*="description"]');
            caption = shadowCaption?.textContent || null;
            shadowRoot.querySelectorAll("li").forEach((li) => {
              const strong = li.querySelector("strong");
              if (!strong) return;
              const label = strong.textContent?.replace(":", "").trim() || "";
              let value = null;
              const button = li.querySelector("button");
              if (button) {
                value = button.textContent || null;
              } else if (strong.nextSibling) {
                value = strong.nextSibling.textContent || null;
              }
              if (label && value) {
                labelValues.push({ label, value });
                console.log(`[Extraction Shadow] Found: ${label} = ${value.substring(0, 50)}`);
              }
            });
          }
          if (!title) {
            const h1El = document.querySelector("h1");
            if (h1El?.textContent && !h1El.textContent.match(/^(WENN|Getty|AFP|Reuters|Shutterstock)$/i)) {
              title = h1El.textContent;
            }
          }
          if (!caption) {
            const captionSelectors = [
              "section p",
              // Main caption paragraph in section
              "p.text-iy-midnight-400",
              "div.text-iy-midnight-400",
              'p[class*="midnight"]',
              'p[class*="caption"]',
              "article p",
              "main p"
            ];
            for (const selector of captionSelectors) {
              const el = document.querySelector(selector);
              if (el?.textContent && el.textContent.length > 20) {
                const text3 = el.textContent.trim();
                if (text3.includes("Credit:") || text3.match(/\d{2}\.\d{2}\.\d{2}/) || text3.includes(" - ")) {
                  caption = text3;
                  console.log("[Extraction Light] Found caption paragraph with embedded metadata");
                  break;
                }
              }
            }
          }
          const contentPartnerSection = document.querySelector("h6.headline");
          if (contentPartnerSection?.textContent?.includes("SmartFrame Content Partner")) {
            const parent = contentPartnerSection.parentElement;
            const partnerName = parent?.querySelector("h2.headline");
            if (partnerName?.textContent) {
              contentPartner = partnerName.textContent.trim();
              console.log(`[Extraction] Found Content Partner: ${contentPartner}`);
            }
          }
          const keywordSection = document.querySelector("h2");
          const keywordSections = Array.from(document.querySelectorAll("h2")).filter(
            (h2) => h2.textContent?.toLowerCase().includes("keywords") || h2.textContent?.toLowerCase().includes("keyword")
          );
          if (keywordSections.length > 0) {
            keywordSections.forEach((section) => {
              const parent = section.parentElement;
              if (parent) {
                const buttons = parent.querySelectorAll('button[type="button"]');
                buttons.forEach((button) => {
                  const keyword = button.textContent?.trim();
                  if (keyword && keyword.length > 0 && !keyword.includes("SmartFrame") && !keyword.includes("View all")) {
                    keywords.push(keyword);
                  }
                });
              }
            });
            console.log(`[Extraction] Found ${keywords.length} keywords`);
          }
          document.querySelectorAll("li").forEach((li) => {
            const strong = li.querySelector("strong");
            if (!strong) return;
            const label = strong.textContent?.replace(":", "").trim() || "";
            if (labelValues.some((lv) => lv.label.toLowerCase() === label.toLowerCase())) {
              return;
            }
            let value = null;
            const button = li.querySelector("button");
            if (button) {
              value = button.textContent || null;
            } else if (strong.nextSibling) {
              value = strong.nextSibling.textContent || null;
            }
            if (label && value) {
              labelValues.push({ label, value });
              console.log(`[Extraction Light] Found: ${label} = ${value.substring(0, 50)}`);
            }
          });
          let nextData = null;
          const extractionLog = [];
          try {
            const nextDataScript = document.querySelector("script#__NEXT_DATA__");
            if (nextDataScript?.textContent) {
              extractionLog.push("Found __NEXT_DATA__ script");
              const parsed = JSON.parse(nextDataScript.textContent);
              const possiblePaths = [
                parsed?.props?.pageProps?.image?.metadata,
                parsed?.props?.pageProps?.metadata,
                parsed?.props?.pageProps?.image,
                parsed?.props?.image?.metadata,
                parsed?.pageProps?.image?.metadata
              ];
              for (const imageMetadata of possiblePaths) {
                if (imageMetadata && typeof imageMetadata === "object") {
                  extractionLog.push(`Found metadata at path in __NEXT_DATA__`);
                  nextData = {
                    photographer: imageMetadata.photographer || imageMetadata.credit || imageMetadata.byline || imageMetadata.author,
                    dimensions: imageMetadata.dimensions || imageMetadata.imageSize || imageMetadata.size,
                    fileSize: imageMetadata.fileSize || imageMetadata.file_size,
                    country: imageMetadata.country || imageMetadata.countryCode,
                    city: imageMetadata.city || imageMetadata.location,
                    date: imageMetadata.date || imageMetadata.dateCreated || imageMetadata.dateTaken || imageMetadata.created,
                    eventTitle: imageMetadata.eventTitle || imageMetadata.event || imageMetadata.matchEvent,
                    title: imageMetadata.title || imageMetadata.headline || imageMetadata.name,
                    caption: imageMetadata.caption || imageMetadata.description,
                    featuring: imageMetadata.featuring || imageMetadata.people || imageMetadata.subject,
                    people: imageMetadata.people || imageMetadata.featuring,
                    tags: imageMetadata.tags || imageMetadata.keywords || imageMetadata.categories || [],
                    copyright: imageMetadata.copyright || imageMetadata.copyrightNotice,
                    credit: imageMetadata.credit || imageMetadata.photographer,
                    comments: imageMetadata.comments || imageMetadata.notes,
                    authors: imageMetadata.authors || imageMetadata.author || imageMetadata.photographer
                  };
                  break;
                }
              }
            }
          } catch (e) {
            extractionLog.push(`__NEXT_DATA__ parse error: ${e}`);
          }
          if (!nextData) {
            try {
              const scripts = Array.from(document.querySelectorAll("script"));
              extractionLog.push(`Searching ${scripts.length} script tags for JSON metadata`);
              for (const script of scripts) {
                if (!script.textContent) continue;
                const content = script.textContent;
                if (content.length < 100) continue;
                if (content.includes("photographer") || content.includes("metadata") || content.includes("caption") || content.includes("copyright")) {
                  try {
                    let jsonData = null;
                    if (content.trim().startsWith("{")) {
                      jsonData = JSON.parse(content);
                    } else if (content.includes("JSON.parse")) {
                      const match = content.match(/JSON\.parse\(['"](.+)['"]\)/);
                      if (match) {
                        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "	");
                        jsonData = JSON.parse(unescaped);
                      }
                    } else {
                      const jsonMatch = content.match(/\{[\s\S]*"photographer"[\s\S]*\}/);
                      if (jsonMatch) {
                        jsonData = JSON.parse(jsonMatch[0]);
                      }
                    }
                    if (jsonData) {
                      extractionLog.push(`Found JSON with metadata keywords`);
                      const findMetadata = (obj) => {
                        if (!obj || typeof obj !== "object") return null;
                        if ((obj.photographer || obj.credit) && (obj.title || obj.caption)) {
                          return obj;
                        }
                        for (const key of Object.keys(obj)) {
                          if (key === "metadata" || key === "image" || key === "imageData") {
                            const nested = findMetadata(obj[key]);
                            if (nested) return nested;
                          }
                        }
                        if (Array.isArray(obj)) {
                          for (const item of obj) {
                            const nested = findMetadata(item);
                            if (nested) return nested;
                          }
                        }
                        return null;
                      };
                      const metadata2 = findMetadata(jsonData);
                      if (metadata2) {
                        extractionLog.push(`Extracted metadata from embedded JSON`);
                        nextData = {
                          photographer: metadata2.photographer || metadata2.credit || metadata2.byline,
                          dimensions: metadata2.dimensions || metadata2.imageSize || metadata2.size,
                          fileSize: metadata2.fileSize || metadata2.file_size,
                          country: metadata2.country,
                          city: metadata2.city,
                          date: metadata2.date || metadata2.dateCreated || metadata2.dateTaken,
                          eventTitle: metadata2.eventTitle || metadata2.event,
                          title: metadata2.title || metadata2.headline,
                          caption: metadata2.caption || metadata2.description,
                          featuring: metadata2.featuring || metadata2.people,
                          people: metadata2.people,
                          tags: metadata2.tags || metadata2.keywords || [],
                          copyright: metadata2.copyright,
                          credit: metadata2.credit,
                          comments: metadata2.comments,
                          authors: metadata2.authors || metadata2.author || metadata2.photographer
                        };
                        break;
                      }
                    }
                  } catch (e) {
                  }
                }
              }
            } catch (e) {
              extractionLog.push(`Script search error: ${e}`);
            }
          }
          extractionLog.forEach((log2) => console.log(`[Extraction] ${log2}`));
          return { title, caption, labelValues, nextData, contentPartner, keywords };
        });
        const errorPageIndicators = [
          "502 bad gateway",
          "503 service unavailable",
          "500 internal server error",
          "504 gateway timeout",
          "429 too many requests",
          "error occurred",
          "page not found",
          "access denied",
          "rate limit exceeded"
        ];
        const titleLower = (rawData.title || "").toLowerCase().trim();
        const isErrorPage = errorPageIndicators.some((indicator) => titleLower.includes(indicator));
        if (isErrorPage) {
          console.log(`\u274C [${imageId}] Error page detected (title: "${rawData.title}"). SmartFrame may be rate-limiting or experiencing issues.`);
          console.log(`\u26A0\uFE0F  [${imageId}] Logging failure and returning partial data for CSV.`);
          failedScrapesLogger.addFailure({
            imageId,
            url,
            reason: `Error page detected: ${rawData.title}`,
            attempts: 1,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return image;
        }
        const hasNoMetadata = (!rawData.labelValues || rawData.labelValues.length === 0) && !rawData.nextData && (!rawData.title || rawData.title.length < 3) && (!rawData.caption || rawData.caption.length < 10);
        if (hasNoMetadata) {
          console.log(`\u26A0\uFE0F  [${imageId}] No metadata found on page - possible error or rate limiting. Logging failure.`);
          failedScrapesLogger.addFailure({
            imageId,
            url,
            reason: "No metadata found - possible rate limiting or error page",
            attempts: 1,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return image;
        }
        const metadata = this.parseMetadata(rawData);
        image.photographer = metadata.photographer ?? image.photographer;
        image.imageSize = metadata.imageSize ?? image.imageSize;
        image.fileSize = metadata.fileSize ?? image.fileSize;
        image.country = metadata.country ?? image.country;
        image.city = metadata.city ?? image.city;
        image.date = metadata.date ?? image.date;
        image.matchEvent = metadata.matchEvent ?? image.matchEvent;
        image.title = metadata.title ?? image.title;
        image.caption = metadata.caption ?? image.caption;
        image.captionRaw = metadata.captionRaw ?? image.captionRaw;
        image.featuring = metadata.featuring ?? image.featuring;
        image.tags = metadata.tags && metadata.tags.length > 0 ? metadata.tags : image.tags;
        image.comments = metadata.comments ?? image.comments;
        image.copyright = metadata.copyright ?? image.copyright;
        image.dateTaken = metadata.dateTaken ?? image.dateTaken;
        image.authors = metadata.authors ?? image.authors;
        image.contentPartner = metadata.contentPartner ?? image.contentPartner;
      } catch (error) {
        console.error(`Error extracting details for ${url}:`, error);
        failedScrapesLogger.addFailure({
          imageId,
          url,
          reason: `Detail extraction error: ${error instanceof Error ? error.message : String(error)}`,
          attempts: 1,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    const canvasExtraction = config.canvasExtraction || "none";
    if (canvasExtraction !== "none" && this.canvasExtractor && extractDetails) {
      try {
        console.log(`[${imageId}] Extracting SmartFrame canvas image in ${canvasExtraction} mode...`);
        const outputDir = path4.join(process.cwd(), "downloaded_images");
        if (!fs4.existsSync(outputDir)) {
          fs4.mkdirSync(outputDir, { recursive: true });
        }
        const canvasImagePath = await this.canvasExtractor.extractCanvasImage(
          page,
          imageId,
          outputDir,
          canvasExtraction
        );
        if (canvasImagePath) {
          console.log(`\u2713 [${imageId}] Canvas image extracted: ${canvasImagePath}`);
          image.canvasImagePath = canvasImagePath;
        } else {
          console.log(`\u26A0\uFE0F  [${imageId}] Canvas extraction failed`);
        }
      } catch (error) {
        console.error(`[${imageId}] Error during canvas extraction:`, error);
      }
    }
    if (this.config?.scraping?.detectEmptyResults !== false && extractDetails) {
      if (this.isEmptyResult(image)) {
        console.log(`\u26A0\uFE0F  [${imageId}] No metadata extracted - all fields are null/empty`);
        failedScrapesLogger.addFailure({
          imageId,
          url,
          reason: "No metadata extracted",
          attempts: 1,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.consecutiveFailures++;
      } else {
        this.consecutiveFailures = 0;
      }
    }
    return image;
  }
};
var scraper = new SmartFrameScraper();

// server/rate-limiter.ts
var RateLimiter = class {
  constructor(maxRequests = 5, windowMs = 6e4) {
    this.requests = /* @__PURE__ */ new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  isAllowed(identifier) {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    if (entry.count >= this.maxRequests) {
      return false;
    }
    entry.count++;
    return true;
  }
  getRemainingTime(identifier) {
    const entry = this.requests.get(identifier);
    if (!entry) return 0;
    const remaining = entry.resetTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
};
var scrapeRateLimiter = new RateLimiter(5, 6e4);
setInterval(() => scrapeRateLimiter.cleanup(), 6e4);

// shared/schema.ts
import { z } from "zod";
var scrapeConfigSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  maxImages: z.number().min(0).max(5e3).default(0),
  extractDetails: z.boolean().default(true),
  sortBy: z.enum(["relevance", "newest", "oldest"]).default("relevance"),
  autoScroll: z.boolean().default(true),
  scrollDelay: z.number().min(500).max(5e3).default(1e3),
  concurrency: z.number().min(1).max(10).default(5),
  canvasExtraction: z.enum(["none", "thumbnail", "full"]).default("none")
});
var scrapedImageSchema = z.object({
  imageId: z.string(),
  hash: z.string(),
  url: z.string().url(),
  copyLink: z.string().url(),
  smartframeId: z.string(),
  thumbnailUrl: z.string().url().nullable(),
  // The 7 clean metadata fields for CSV export
  titleField: z.string().nullable(),
  subjectField: z.string().nullable(),
  tags: z.string().nullable(),
  comments: z.string().nullable(),
  authors: z.string().nullable(),
  dateTaken: z.string().nullable(),
  copyright: z.string().nullable()
});
var scrapeJobSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  status: z.enum(["pending", "scraping", "completed", "error"]),
  progress: z.number().min(0).max(100),
  totalImages: z.number(),
  scrapedImages: z.number(),
  images: z.array(scrapedImageSchema),
  error: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  config: scrapeConfigSchema
});
var exportFormatSchema = z.enum(["json", "csv"]);

// server/routes.ts
import { stringify } from "csv-stringify/sync";
async function registerRoutes(app2) {
  app2.post("/api/scrape/bulk", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!scrapeRateLimiter.isAllowed(clientIp)) {
        const remainingTime = Math.ceil(scrapeRateLimiter.getRemainingTime(clientIp) / 1e3);
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter: remainingTime
        });
      }
      const { urls } = req.body;
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "URLs array is required" });
      }
      const invalidUrls = urls.filter((url) => !url.includes("smartframe.com"));
      if (invalidUrls.length > 0) {
        return res.status(400).json({ error: "All URLs must be from smartframe.com" });
      }
      const uniqueUrls = [...new Set(urls)];
      const duplicateCount = urls.length - uniqueUrls.length;
      if (duplicateCount > 0) {
        console.log(`Removed ${duplicateCount} duplicate URL(s) from bulk request. Processing ${uniqueUrls.length} unique URLs.`);
      }
      if (uniqueUrls.length > 50) {
        return res.status(400).json({ error: "Maximum 50 URLs allowed per bulk request" });
      }
      const jobs = [];
      for (const url of uniqueUrls) {
        const config = scrapeConfigSchema.parse({
          url,
          maxImages: req.body.maxImages !== void 0 ? req.body.maxImages : 0,
          extractDetails: req.body.extractDetails !== false,
          sortBy: req.body.sortBy || "relevance",
          autoScroll: req.body.autoScroll !== false,
          scrollDelay: req.body.scrollDelay || 1e3,
          concurrency: req.body.concurrency || 5,
          canvasExtraction: req.body.canvasExtraction || "none"
        });
        const job = await storage.createScrapeJob(url, config);
        jobs.push({ jobId: job.id, url });
        scraper.scrape(job.id, url, config).catch((error) => {
          console.error(`Scraping failed for ${url}:`, error);
        });
      }
      res.json({
        jobs,
        status: "started",
        count: jobs.length,
        ...duplicateCount > 0 && {
          duplicatesRemoved: duplicateCount,
          message: `Removed ${duplicateCount} duplicate URL(s). Processing ${uniqueUrls.length} unique URLs.`
        }
      });
    } catch (error) {
      console.error("Error starting bulk scrape:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to start scraping"
      });
    }
  });
  app2.post("/api/scrape/start", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (!scrapeRateLimiter.isAllowed(clientIp)) {
        const remainingTime = Math.ceil(scrapeRateLimiter.getRemainingTime(clientIp) / 1e3);
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter: remainingTime
        });
      }
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      if (!url.includes("smartframe.com")) {
        return res.status(400).json({ error: "URL must be from smartframe.com" });
      }
      const config = scrapeConfigSchema.parse({
        url,
        maxImages: req.body.maxImages !== void 0 ? req.body.maxImages : 0,
        extractDetails: req.body.extractDetails !== false,
        sortBy: req.body.sortBy || "relevance",
        autoScroll: req.body.autoScroll !== false,
        scrollDelay: req.body.scrollDelay || 1e3,
        concurrency: req.body.concurrency || 5,
        canvasExtraction: req.body.canvasExtraction || "none"
      });
      const job = await storage.createScrapeJob(url, config);
      scraper.scrape(job.id, url, config).catch((error) => {
        console.error("Scraping failed:", error);
      });
      res.json({ jobId: job.id, status: "started" });
    } catch (error) {
      console.error("Error starting scrape:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to start scraping"
      });
    }
  });
  app2.get("/api/scrape/job/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getScrapeJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch job"
      });
    }
  });
  app2.get("/api/scrape/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllScrapeJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to fetch jobs"
      });
    }
  });
  app2.get("/api/export/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { format: format2 = "json" } = req.query;
      const job = await storage.getScrapeJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      if (!job.images || job.images.length === 0) {
        return res.status(400).json({ error: "No images to export" });
      }
      if (format2 === "csv") {
        const csvExportData = job.images.map((img) => ({
          imageId: img.imageId,
          url: img.url,
          copyLink: img.copyLink,
          titleField: img.titleField,
          subjectField: img.subjectField,
          tags: img.tags,
          comments: img.comments,
          authors: img.authors,
          dateTaken: img.dateTaken,
          copyright: img.copyright
        }));
        const csvData = stringify(csvExportData, {
          header: true,
          columns: [
            { key: "imageId", header: "ImageID" },
            { key: "url", header: "Page URL" },
            { key: "copyLink", header: "Copy Link" },
            { key: "titleField", header: "Title Field" },
            { key: "subjectField", header: "Subject Field" },
            { key: "tags", header: "Tags" },
            { key: "comments", header: "Comments" },
            { key: "authors", header: "Authors" },
            { key: "dateTaken", header: "Date Taken" },
            { key: "copyright", header: "Copyright" }
          ]
        });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="smartframe-export-${jobId}.csv"`
        );
        res.send(csvData);
      } else {
        const jsonData = {
          jobId: job.id,
          url: job.url,
          totalImages: job.images.length,
          scrapedAt: job.startedAt,
          completedAt: job.completedAt,
          images: job.images
        };
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="smartframe-export-${jobId}.json"`
        );
        res.json(jsonData);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to export data"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs5 from "fs";
import path6 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path5 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path5.resolve(import.meta.dirname, "client", "src"),
      "@shared": path5.resolve(import.meta.dirname, "shared"),
      "@assets": path5.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path5.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path5.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            if (id.includes("wouter")) {
              return "router";
            }
            if (id.includes("@tanstack/react-query")) {
              return "react-query";
            }
            if (id.includes("@radix-ui")) {
              return "ui-vendor";
            }
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "form";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
            return "vendor";
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"]
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path6.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs5.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path6.resolve(import.meta.dirname, "public");
  if (!fs5.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path6.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ verify: (req, res, buf) => {
  req.rawBody = buf;
} }));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path7 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path7.startsWith("/api")) {
      let logLine = `${req.method} ${path7} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
