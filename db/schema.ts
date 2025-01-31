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
  code: text("code").notNull(),
  language: text("language").notNull().default("javascript"),
  mode: text("mode").notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewResults = pgTable("review_results", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").references(() => reviews.id).notNull(),
  suggestions: jsonb("suggestions").notNull(),
  improvements: jsonb("improvements").notNull(),
  security: jsonb("security").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  results: many(reviewResults),
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
export const insertReviewResultSchema = createInsertSchema(reviewResults);
export const selectReviewResultSchema = createSelectSchema(reviewResults);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type SelectReview = typeof reviews.$inferSelect;
export type InsertReviewResult = typeof reviewResults.$inferInsert;
export type SelectReviewResult = typeof reviewResults.$inferSelect;