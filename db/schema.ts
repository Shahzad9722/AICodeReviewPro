import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull().default("javascript"),
  mode: text("mode").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewFiles = pgTable("review_files", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => reviews.id).notNull(),
  path: text("path").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewResults = pgTable("review_results", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => reviews.id).notNull(),
  suggestions: jsonb("suggestions").notNull(),
  improvements: jsonb("improvements").notNull(),
  security: jsonb("security").notNull(),
  dependencies: jsonb("dependencies").notNull(),
  architecture: jsonb("architecture").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  files: many(reviewFiles),
  results: many(reviewResults),
}));

export const reviewFilesRelations = relations(reviewFiles, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewFiles.reviewId],
    references: [reviews.id],
  }),
}));

export const reviewResultsRelations = relations(reviewResults, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewResults.reviewId],
    references: [reviews.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);
export const insertReviewFileSchema = createInsertSchema(reviewFiles);
export const selectReviewFileSchema = createSelectSchema(reviewFiles);
export const insertReviewResultSchema = createInsertSchema(reviewResults);
export const selectReviewResultSchema = createSelectSchema(reviewResults);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type SelectReview = typeof reviews.$inferSelect;
export type InsertReviewFile = typeof reviewFiles.$inferInsert;
export type SelectReviewFile = typeof reviewFiles.$inferSelect;
export type InsertReviewResult = typeof reviewResults.$inferInsert;
export type SelectReviewResult = typeof reviewResults.$inferSelect;