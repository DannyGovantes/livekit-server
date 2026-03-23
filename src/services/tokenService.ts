import { AccessToken, VideoGrant } from "livekit-server-sdk";

export interface TokenOptions {
  /**
   * Time-to-live for the token in seconds (default: 6 hours)
   */
  ttl?: number;
  /**
   * Grant room admin privileges (create/list/delete rooms)
   */
  isAdmin?: boolean;
  /**
   * Allow publishing audio/video tracks (default: true)
   */
  canPublish?: boolean;
  /**
   * Allow subscribing to other participants' tracks (default: true)
   */
  canSubscribe?: boolean;
  /**
   * Metadata to attach to the participant
   */
  metadata?: string;
}

/**
 * Generate a LiveKit access token for a participant to join a room
 * @param roomName - The name of the room to join
 * @param participantName - The identity/name of the participant
 * @param options - Additional token configuration options
 * @returns JWT token string
 */
export async function generateToken(
  roomName: string,
  participantName: string,
  options: TokenOptions = {},
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in environment variables",
    );
  }

  const {
    ttl = 6 * 60 * 60, // 6 hours default
    isAdmin = false,
    canPublish = true,
    canSubscribe = true,
    metadata,
  } = options;

  // Create access token
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl,
    metadata,
  });

  // Define video grants
  const videoGrant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe,
    roomAdmin: isAdmin,
    roomCreate: isAdmin,
    roomList: isAdmin,
  };

  token.addGrant(videoGrant);

  return await token.toJwt();
}
