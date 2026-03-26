import cors from "@fastify/cors";
import dotenv from "dotenv";
import Fastify from "fastify";
import {
  generateToken as createToken,
  TokenOptions,
} from "./services/tokenService";

dotenv.config();

const server = Fastify({ logger: true });

server.register(cors, { origin: true });

interface TokenRequest {
  roomName: string;
  participantName: string;
  isAdmin?: boolean;
  canPublish?: boolean;
  canSubscribe?: boolean;
  ttl?: number;
  metadata?: string;
}

// Health check
server.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Token generation endpoint
server.post<{ Body: TokenRequest }>(
  "/api/token",
  {
    schema: {
      body: {
        type: "object",
        required: ["roomName", "participantName"],
        properties: {
          roomName: { type: "string", minLength: 1 },
          participantName: { type: "string", minLength: 1 },
          isAdmin: { type: "boolean" },
          canPublish: { type: "boolean" },
          canSubscribe: { type: "boolean" },
          ttl: { type: "number" },
          metadata: { type: "string" },
        },
      },
    },
  },
  async (request, reply) => {
    const {
      roomName,
      participantName,
      isAdmin,
      canPublish,
      canSubscribe,
      ttl,
      metadata,
    } = request.body;

    const options: TokenOptions = {
      isAdmin,
      canPublish,
      canSubscribe,
      ttl,
      metadata,
    };

    let token: string;
    try {
      token = await createToken(roomName, participantName, options);
    } catch (err) {
      request.log.error(err, "Failed to generate LiveKit token");
      return reply.status(500).send({
        error: "Token generation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }

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
        try {
          const longUrl = `https://meet.livekit.io/custom?liveKitUrl=${wsUrl}&token=${token}`;
          const shortUrlRes = await fetch(
            `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`,
          );
          const data = (await shortUrlRes.json()) as { shorturl: string };
          response.shortUrl = data.shorturl;
        } catch {
          // Short URL generation is optional
        }
      }
    }

    return response;
  },
);

// Start server
const start = async () => {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "0.0.0.0";

  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
