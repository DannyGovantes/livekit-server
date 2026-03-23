import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { generateToken, TokenOptions } from "./services/tokenService";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request body interface
interface TokenRequest {
  roomName: string;
  participantName: string;
  isAdmin?: boolean;
  canPublish?: boolean;
  canSubscribe?: boolean;
  ttl?: number;
  metadata?: string;
}

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Token generation endpoint
app.post(
  "/api/token",
  async (
    req: Request<{}, {}, TokenRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const {
        roomName,
        participantName,
        isAdmin,
        canPublish,
        canSubscribe,
        ttl,
        metadata,
      } = req.body;

      // Validate required fields
      if (!roomName || typeof roomName !== "string") {
        res
          .status(400)
          .json({ error: "roomName is required and must be a string" });
        return;
      }

      if (!participantName || typeof participantName !== "string") {
        res
          .status(400)
          .json({ error: "participantName is required and must be a string" });
        return;
      }

      // Build token options
      const options: TokenOptions = {
        isAdmin,
        canPublish,
        canSubscribe,
        ttl,
        metadata,
      };

      // Generate token
      const token = await generateToken(roomName, participantName, options);

      res.json({
        token,
        roomName,
        participantName,
        expiresIn: options.ttl || 6 * 60 * 60,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LiveKit Token Server running on http://localhost:${PORT}`);
  console.log(`📝 Generate tokens: POST http://localhost:${PORT}/api/token`);
  console.log(`❤️  Health check: GET http://localhost:${PORT}/health`);
});
