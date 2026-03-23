import { HttpFunction } from "@google-cloud/functions-framework";
import {
  generateToken as createToken,
  TokenOptions,
} from "./services/tokenService";

interface TokenRequest {
  roomName: string;
  participantName: string;
  isAdmin?: boolean;
  canPublish?: boolean;
  canSubscribe?: boolean;
  ttl?: number;
  metadata?: string;
}

/**
 * HTTP Cloud Function to generate LiveKit access tokens
 */
export const generateToken: HttpFunction = async (req, res) => {
  // CORS headers - adjust origin for production
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const body: TokenRequest = req.body;
    const {
      roomName,
      participantName,
      isAdmin,
      canPublish,
      canSubscribe,
      ttl,
      metadata,
    } = body;

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
    const token = await createToken(roomName, participantName, options);

    res.json({
      token,
      roomName,
      participantName,
      expiresIn: options.ttl || 6 * 60 * 60,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
