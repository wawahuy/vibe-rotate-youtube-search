# YouTube Rotate API — Deploy Guide

## Vercel Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Link project
```bash
cd /path/to/youtube-rotate-api
vercel link
```

### 4. Set Environment Variables in Vercel Dashboard
Go to **Project Settings → Environment Variables** and add:
```
MONGODB_URI
JWT_SECRET
ENCRYPTION_SECRET
ADMIN_USERNAME
ADMIN_PASSWORD
NEXT_PUBLIC_API_URL=  (leave empty — same domain)
```

### 5. Deploy
```bash
vercel --prod
```

---

## Local Development

### Setup
```bash
# Copy env file
cp .env.example .env
# Edit .env with real values

# Install all deps
cd apps/api && npm install
cd ../web && npm install
```

### Run
```bash
# Terminal 1 — API
cd apps/api && npm run start:dev

# Terminal 2 — Frontend
cd apps/web && npm run dev
```

Visit:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

---

## yt-dlp Setup

### Option 1: Install globally
```bash
# Linux/macOS
pip install yt-dlp
# or
brew install yt-dlp
```

### Option 2: Bundle binary with project
```bash
mkdir -p apps/api/bin
# Download yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o apps/api/bin/yt-dlp
chmod +x apps/api/bin/yt-dlp
```

### Option 3 (Vercel): Remote microservice
Since Vercel serverless cannot run binaries easily, deploy yt-dlp as a separate microservice (e.g., Railway, Render, Fly.io) and set `YTDLP_REMOTE_URL` env var.

---

## API Key Rotation Logic

1. On `/api/search?q=keyword`:
   - Fetch all **active** YouTube keys from DB
   - Try each key sequentially
   - If `403/429` → mark key as **exhausted** with `resetAt = tomorrow midnight`
   - If all YouTube keys fail → try SerpAPI keys same way
   - If all fail → return `503 All API keys exhausted`

2. At each request, keys past their `resetAt` are automatically re-activated

---

## Seeding Initial API Keys

Use the admin UI at `/api-keys` after logging in, or via curl:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}' | jq -r .access_token)

curl -X POST http://localhost:3001/api/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"AIzaYourYouTubeKey","provider":"youtube","label":"YT Key 1","quotaLimit":10000}'
```

---

## Project Structure

```
youtube-rotate-api/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── main.ts         # Local dev entry
│   │       ├── vercel.ts       # Vercel serverless handler
│   │       ├── app.module.ts
│   │       ├── auth/           # JWT auth
│   │       ├── search/         # Search endpoint
│   │       ├── providers/      # YouTube + SerpAPI + KeyRotation
│   │       ├── api-keys/       # CRUD for keys
│   │       ├── report/         # Usage reports
│   │       ├── video-info/     # yt-dlp integration
│   │       ├── database/       # Mongoose schemas
│   │       └── common/         # Encryption, Guards
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx    # Redirects to dashboard
│           │   ├── login/
│           │   ├── dashboard/  # Search UI
│           │   ├── api-keys/   # Key management
│           │   └── report/     # Usage report
│           ├── components/     # Navbar
│           └── lib/api.ts      # Axios client
├── vercel.json                 # Vercel deployment config
├── .env.example
└── package.json                # Workspace root
```
