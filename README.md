# LiveKit Token Generator

A serverless function to generate LiveKit access tokens for your real-time applications.

## Features

- Generate JWT tokens for LiveKit rooms
- Configurable permissions (publish, subscribe, admin)
- CORS enabled
- Ready for serverless deployment (GCP, AWS, etc.)

## Prerequisites

- Node.js 18+
- LiveKit API credentials (from [LiveKit Cloud](https://cloud.livekit.io) or self-hosted)

## Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally (uses Google Cloud Functions Framework)
npm run dev
```

The server runs on `http://localhost:8080`

### Test Locally

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"roomName": "my-room", "participantName": "user1"}'
```

## Environment Variables

Set these in your cloud provider's environment configuration:

| Variable             | Description             |
| -------------------- | ----------------------- |
| `LIVEKIT_API_KEY`    | Your LiveKit API Key    |
| `LIVEKIT_API_SECRET` | Your LiveKit API Secret |

For local development, create a `.env` file (see `.env.example`).

## API Usage

### Generate Token

**POST** `/`

#### Request Body

```json
{
  "roomName": "my-room",
  "participantName": "user1",
  "isAdmin": false,
  "canPublish": true,
  "canSubscribe": true,
  "ttl": 21600,
  "metadata": "{\"role\": \"host\"}"
}
```

| Field             | Type    | Required | Default | Description                       |
| ----------------- | ------- | -------- | ------- | --------------------------------- |
| `roomName`        | string  | Yes      | -       | Name of the room to join          |
| `participantName` | string  | Yes      | -       | Identity of the participant       |
| `isAdmin`         | boolean | No       | `false` | Grant room admin privileges       |
| `canPublish`      | boolean | No       | `true`  | Allow publishing audio/video      |
| `canSubscribe`    | boolean | No       | `true`  | Allow subscribing to tracks       |
| `ttl`             | number  | No       | `21600` | Token expiry in seconds (6 hours) |
| `metadata`        | string  | No       | -       | JSON metadata for the participant |

#### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "my-room",
  "participantName": "user1",
  "expiresIn": 21600
}
```

## Deployment

### Google Cloud Functions

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy
gcloud functions deploy generateToken \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point generateToken \
  --set-env-vars LIVEKIT_API_KEY=your_key,LIVEKIT_API_SECRET=your_secret \
  --source .
```

Endpoint: `https://REGION-PROJECT_ID.cloudfunctions.net/generateToken`

### AWS Lambda

1. Build the project: `npm run build`
2. Create a Lambda function with Node.js 20 runtime
3. Use an adapter like `@vendia/serverless-express` or rewrite for API Gateway
4. Set environment variables in Lambda configuration

### Vercel

1. Move `dist/index.js` to `api/token.ts`
2. Adjust imports for Vercel's format
3. Deploy with `vercel`

### Cloudflare Workers

Requires rewriting for Workers runtime (no Node.js APIs).

## Project Structure

```
├── src/
│   ├── index.ts                 # Cloud Function entry point
│   └── services/
│       └── tokenService.ts      # Token generation logic
├── dist/                        # Compiled JavaScript (git-ignored)
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Security Considerations

- **Never commit `.env`** with real credentials
- Use environment variables in your cloud provider
- Consider adding authentication to the endpoint in production
- Restrict CORS origins for production use

## License

ISC
