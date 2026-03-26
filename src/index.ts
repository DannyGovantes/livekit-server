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
  const origin = req.headers.origin;

  res.set("Access-Control-Allow-Origin", origin);
  // CORS headers - adjust origin for production
  res.set("Access-Control-Allow-Credentials", "true");
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

    // Build response
    const response: {
      token: string;
      roomName: string;
      participantName: string;
      expiresIn: number;
      shortUrl?: string;
    } = {
      token,
      roomName,
      participantName,
      expiresIn: options.ttl || 6 * 60 * 60,
    };

    // Generate short URL for non-admin users
    if (!isAdmin) {
      const wsUrl = process.env.LIVEKIT_WS_URL;
      if (wsUrl) {
        const longUrl = `https://meet.livekit.io/custom?liveKitUrl=${wsUrl}&token=${token}`;
        const shortUrlRes = await fetch(
          `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`,
        );
        const data = (await shortUrlRes.json()) as { shorturl: string };
        response.shortUrl = data.shorturl;
      }
    }

    res.json(response);
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
