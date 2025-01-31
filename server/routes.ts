import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeCode } from "./openai";

export function registerRoutes(app: Express): Server {
  // Code review endpoint
  app.post("/api/review", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({
          message: "Code is required and must be a string",
        });
      }

      const analysis = await analyzeCode(code);
      res.json(analysis);
    } catch (error) {
      console.error("Error in code review:", error);
      res.status(500).json({
        message: error.message || "Failed to analyze code",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
