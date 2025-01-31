import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeCode, type ReviewMode } from "./openai";
import { db } from "@db";
import { reviews, reviewFiles, reviewResults } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Application review endpoint with mode selection
  app.post("/api/review", async (req, res) => {
    try {
      const { 
        files, 
        name, 
        description = "", 
        mode = "general", 
        language = "javascript", 
        save = false 
      } = req.body;

      console.log("Received review request:", {
        filesCount: files?.length,
        name,
        mode,
        language
      });

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          message: "At least one file is required for review",
        });
      }

      if (!name) {
        return res.status(400).json({
          message: "Review name is required",
        });
      }

      console.log("Analyzing files...");
      const analysis = await analyzeCode(files, mode as ReviewMode, language);
      console.log("Analysis completed");

      if (save) {
        // Save the review and results
        const [review] = await db.insert(reviews).values({
          name,
          description,
          language,
          mode,
        }).returning();

        // Save all files
        await db.insert(reviewFiles).values(
          files.map(file => ({
            reviewId: review.id,
            path: file.path,
            content: file.content,
          }))
        );

        // Save review results
        await db.insert(reviewResults).values({
          reviewId: review.id,
          suggestions: analysis.suggestions,
          improvements: analysis.improvements,
          security: analysis.security,
          dependencies: analysis.dependencies,
          architecture: analysis.architecture,
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

  // Get saved reviews with their files and results
  app.get("/api/reviews", async (_req, res) => {
    try {
      const savedReviews = await db.query.reviews.findMany({
        with: {
          files: true,
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

  // Get a specific review by ID
  app.get("/api/reviews/:id", async (req, res) => {
    try {
      const review = await db.query.reviews.findFirst({
        where: eq(reviews.id, parseInt(req.params.id)),
        with: {
          files: true,
          results: true,
        },
      });

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({
        message: (error as Error).message || "Failed to fetch review",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}