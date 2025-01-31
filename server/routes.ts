import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeCode, type ReviewMode } from "./openai";
import { db } from "@db";
import { reviews, reviewResults } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Code review endpoint with mode selection
  app.post("/api/review", async (req, res) => {
    try {
      const { code, mode = "general", language = "javascript", save = false } = req.body;

      if (!code || typeof code !== "string") {
        return res.status(400).json({
          message: "Code is required and must be a string",
        });
      }

      const analysis = await analyzeCode(code, mode as ReviewMode, language);

      if (save) {
        // Save the review and results
        const [review] = await db.insert(reviews).values({
          code,
          language,
          mode,
        }).returning();

        await db.insert(reviewResults).values({
          reviewId: review.id,
          suggestions: analysis.suggestions,
          improvements: analysis.improvements,
          security: analysis.security,
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error in code review:", error);
      res.status(500).json({
        message: (error as Error).message || "Failed to analyze code",
      });
    }
  });

  // Get saved reviews
  app.get("/api/reviews", async (_req, res) => {
    try {
      const savedReviews = await db.query.reviews.findMany({
        with: {
          results: true,
        },
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      });

      res.json(savedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({
        message: (error as Error).message || "Failed to fetch reviews",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}