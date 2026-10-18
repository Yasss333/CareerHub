# CareerHub Complete Production Deployment Guide

This comprehensive guide walks you through deploying the entire **CareerHub** platform to free-tier cloud providers:
1. **ML Proctoring Microservice**: [Hugging Face Spaces](https://huggingface.co/spaces) (Docker SDK, **16 GB RAM Free**)
2. **Database**: [Neon](https://neon.tech) (Serverless PostgreSQL Free Tier)
3. **Backend API**: [Render](https://render.com) (Node.js 22 + Express + Prisma)
4. **Frontend Web App**: [Vercel](https://vercel.com) (React 18 + Vite SPA)
5. **Alternative**: All-in-One Production Docker Deployment (`docker-compose.prod.yml`)

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │             User's Browser             │
                      └───────────────────┬────────────────────┘
                                          │
                        HTTPS (Same-Origin / Custom Domain)
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          Vercel Frontend (SPA)         │
                      │             React 18 + Vite            │
                      └───────────────────┬────────────────────┘
                                          │
                             Rewrite /api/* to Render
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │           Render Web Service           │
                      │         Express + Prisma Backend       │
                      └───┬───────────────┬────────────────┬───┘
                          │               │                │
            Prisma Query  │               │ ML Proxy       │ Code Execution
                          ▼               ▼                ▼
     ┌──────────────────────┐   ┌───────────────────┐    ┌─────────────────┐
     │         Neon         │   │   Hugging Face    │    │   Piston API    │
     │      PostgreSQL      │   │   Docker Space    │    │ (Public/Custom) │
     │ (Pooled + Direct URL)│   │ (ViT+Wav2Vec2+ML) │    │  Code Sandbox   │
     └──────────────────────┘   └───────────────────┘    └─────────────────┘
```

---

## Prerequisites (Accounts Checklist)

All services can be deployed on generous **100% free tiers**:

| Service | Provider | Purpose | Free Tier Specs |
|---|---|---|---|
| **ML Proctoring** | [Hugging Face](https://huggingface.co) | Facial emotion, voice emotion, anti-cheating FaceNet | **2 vCPU, 16 GB RAM** |
| **Database** | [Neon](https://neon.tech) | Primary PostgreSQL database with pooling | **0.5 GB Storage, pooled connections** |
| **Backend API** | [Render](https://render.com) | Express REST API, Prisma migrations, Auth | **512 MB RAM, free web service** |
| **Frontend Web** | [Vercel](https://vercel.com) | React 18 SPA with automated edge rewrites | **Unlimited bandwidth & builds** |
| **Code Runner** | [EMKC Piston](https://emkc.org) | AlgoRank remote code execution sandbox | **Free public API** |
| **LLM (Optional)**| [OpenRouter](https://openrouter.ai) | Resume parsing, AI questions, feedback | **Pay-as-you-go or free models** |
| **CDN (Optional)**| [ImageKit](https://imagekit.io) | Candidate profile avatars and resume images | **20 GB free bandwidth** |

---

## Part 1: Deploy ML Service to Hugging Face Spaces

The AI Mock Interview multimodal emotion service runs PyTorch models:
- **Vision Transformer** (`trpakov/vit-face-expression`) for facial emotions
- **Wav2Vec2** (`ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition`) for speech emotion
- **FaceNet** (`facenet-pytorch`) for anti-cheating identity verification
- **DistilRoBERTa** (`j-hartmann/emotion-english-distilroberta-base`) for text sentiment

Because these models require ~2–3 GB RAM, Hugging Face Spaces is the optimal host (providing **16 GB RAM for free**).

### Step 1.1: Create a New Space
1. Log in to [Hugging Face](https://huggingface.co).
2. Click **New Space** (or navigate to `https://huggingface.co/new-space`).
3. Fill in the details:
   - **Space name**: `careerhub-ml-proctoring` (or any name you prefer)
   - **License**: `mit` or `apache-2.0`
   - **Select Space SDK**: **Docker**
   - **Docker template**: Choose **Blank**
   - **Space Hardware**: **CPU basic • 2 vCPU • 16 GB RAM • FREE**
   - **Visibility**: **Public** (recommended for easy API calls; backend authenticates via private header token)
4. Click **Create Space**.

---

### Step 1.2: Upload / Push the ML Service Files

You can deploy using either the **Web UI** or the **Helper Script**:

#### Option A: 1-Click Helper Script (Recommended)
From the root of your CareerHub project, run:

**On Windows (PowerShell):**
```powershell
.\scripts\deploy-hf-space.ps1 -SpaceRepoUrl "https://huggingface.co/spaces/<your-username>/careerhub-ml-proctoring"
```

**On Linux / macOS / WSL:**
```bash
chmod +x scripts/deploy-hf-space.sh
./scripts/deploy-hf-space.sh "https://huggingface.co/spaces/<your-username>/careerhub-ml-proctoring"
```

#### Option B: Web UI Upload
1. In your newly created Space, open the **Files** tab.
2. Click **Add file** -> **Upload files**.
3. Upload all files from the `services/proctoring/` directory:
   - `Dockerfile`
   - `README.md`
   - `requirements.txt`
   - `.dockerignore`
   - `server.py`
   - `fusion_engine_new.py`
   - `facial_inference.py`
   - `voice_inference.py`
   - `text_inference.py`
   - `face_verifier.py`
4. Commit the changes.

---

### Step 1.3: Set the Secret Token in Hugging Face
1. Go to your Space's **Settings** tab.
2. Scroll to **Variables and secrets**.
3. Under **Secrets**, click **New secret**:
   - **Name**: `INTERVIEW_ML_TOKEN`
   - **Value**: Create a strong random string (e.g. `ch_ml_sec_99a8b7c6d5e4f3a2b1c0`).
4. Hugging Face will automatically trigger a build of the Docker container.
5. Wait ~2–3 minutes for the build to complete. When the status badge turns **Running**, your ML service is live!

### Step 1.4: Verify the ML Service
Your public URL follows this format:
```
https://<your-username>-<space-name>.hf.space
```
Open in your browser:
```
https://<your-username>-<space-name>.hf.space/health
```
You should receive:
```json
{
  "status": "healthy",
  "facial_model_loaded": true,
  "voice_model_loaded": true,
  "text_model_loaded": true,
  "face_verification_loaded": true
}
```

---

## Part 2: Provision Neon PostgreSQL Database

1. Sign up / Log in to [Neon](https://neon.tech).
2. Click **Create Project**:
   - **Project Name**: `careerhub`
   - **Postgres version**: `16` or `15`
   - **Region**: Choose a region close to your Render deployment (e.g., `US East (N. Virginia)` or `Frankfurt`).
3. In your project dashboard, navigate to the **Dashboard** / **Connection Details** panel:
   - Select **Connection string**:
     - Mode: **Pooled connection**
     - Copy this value as your `DATABASE_URL` (host will contain `-pooler`).
   - Check **Show direct connection** (or switch to Unpooled mode):
     - Copy this value as your `DIRECT_URL` (host will NOT contain `-pooler`).

> [!IMPORTANT]
> Both URLs must contain `?sslmode=require`.
> - `DATABASE_URL` is used for application queries with serverless connection pooling.
> - `DIRECT_URL` is required by Prisma for database schema migrations (`prisma migrate deploy`).

---

## Part 3: Deploy Backend API on Render

Render builds the monorepo API, applies Prisma migrations, and starts Express on port 5000.

### Step 3.1: Connect Your Git Repository to Render
1. Push your CareerHub repository to GitHub or GitLab.
2. Log in to [Render](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Select your `CareerHub` repository.
5. Render reads `render.yaml` automatically from the root.

---

### Step 3.2: Configure Environment Variables in Render

Render will prompt you for variables configured in `render.yaml`:

| Environment Variable | Required | Description / Example Value |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon pooled connection string (`...-pooler...sslmode=require`) |
| `DIRECT_URL` | **Yes** | Neon direct connection string (`...sslmode=require`) |
| `JWT_SECRET` | **Yes** | Auto-generated by Render (must be $\ge 32$ chars) |
| `JWT_EXPIRES_IN` | **Yes** | `7d` |
| `CLIENT_ORIGIN` | **Yes** | Your Vercel frontend URL, e.g. `https://careerhub.vercel.app` *(add temporary `http://localhost:5173` if Vercel is not yet deployed)* |
| `PISTON_API_URL` | **Yes** | `https://emkc.org/api/v2/piston/execute` |
| `INTERVIEW_ML_URL` | Optional | Your Hugging Face Space URL: `https://<username>-<space>.hf.space` |
| `INTERVIEW_ML_TOKEN`| Optional | Same token you created in Hugging Face Space secrets |
| `OPENROUTER_API_KEY`| Optional | OpenRouter API Key for AI resume enhancement & interview questions |
| `MODEL_NAME` | Optional | `openai/gpt-4o-mini` |
| `IMAGEKIT_PUBLIC_KEY`| Optional | ImageKit public key for avatar/resume image storage |
| `IMAGEKIT_PRIVATE_KEY`| Optional| ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT`| Optional| ImageKit URL endpoint |
| `LIVEKIT_URL` | Optional | LiveKit SFU URL (`wss://...` or self-hosted; defaults to Jitsi fallback if omitted) |
| `LIVEKIT_API_KEY` | Optional | LiveKit API Key |
| `LIVEKIT_API_SECRET` | Optional | LiveKit API Secret |

---

### Step 3.3: Manual Web Service Setup (Alternative to Blueprint)
If you prefer creating a Web Service manually without Blueprints:
- **Environment**: `Node`
- **Root Directory**: `.` (leave blank / root)
- **Build Command**:
  ```bash
  npm ci && npm run build:api && npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
  ```
- **Start Command**:
  ```bash
  npm run start --workspace=@careerhub/api
  ```
- **Health Check Path**: `/health/ready`

### Step 3.4: Verify the Backend API
Once deployed, verify:
- `https://<your-api>.onrender.com/health` -> `{"status":"ok","message":"CareerHub API is running"}`
- `https://<your-api>.onrender.com/health/ready` -> `{"status":"ok","database":"connected"}`

---

## Part 4: Deploy Frontend on Vercel

CareerHub uses a clean Vite SPA with a reverse-proxy configured in `vercel.json`. This forwards all `/api/*` browser requests to your Render API without CORS or third-party cookie restrictions.

### Step 4.1: Update `vercel.json` with Your Render URL
Before deploying to Vercel, open `vercel.json` in your repository root:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build:web",
  "outputDirectory": "apps/web/dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://<your-render-service-name>.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Replace `https://<your-render-service-name>.onrender.com` with your exact Render backend domain.

---

### Step 4.2: Import to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository.
4. Set the project configurations:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (keep at repository root so npm workspaces resolve)
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `apps/web/dist`
   - **Install Command**: `npm ci`
5. Click **Deploy**.

---

### Step 4.3: Sync Allowed Origin with Render
1. Once Vercel assigns your production URL (e.g. `https://careerhub-ten.vercel.app` or custom domain `https://careerhub.yourdomain.com`).
2. Go to **Render** -> your `careerhub-api` service -> **Environment**.
3. Update `CLIENT_ORIGIN`:
   ```
   https://careerhub-ten.vercel.app,https://careerhub.yourdomain.com
   ```
4. Save and trigger a redeploy of the API.

---

## Part 5: Alternative — 1-Click All-in-One Docker Deployment

If you are deploying to a VPS (DigitalOcean, Hetzner, AWS EC2, Coolify, or CapRover), you can launch the complete production stack (PostgreSQL + ML Service + Express API + React Web with Nginx) with a single command.

1. Clone the repository onto your server:
   ```bash
   git clone https://github.com/your-username/CareerHub.git
   cd CareerHub
   ```
2. Copy and configure production environment variables:
   ```bash
   cp apps/api/.env.example .env.prod
   ```
3. Run the production Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Services will be available on:
   - **Web App**: `http://<server-ip>:80`
   - **API Backend**: `http://<server-ip>:5000`
   - **ML Proctoring**: `http://<server-ip>:8000`
   - **PostgreSQL**: Internal container `postgres:5432`

---

## Part 6: Full Verification Checklist

Once all services are deployed, perform this smoke test:

- [ ] **Database Connection**: Visit `https://<api-url>/health/ready` — verify `database: connected`.
- [ ] **ML Proctoring**: Visit `https://<hf-space-url>/health` — verify all models are loaded.
- [ ] **User Registration**:
  - Register as **Candidate** (`role = CANDIDATE`) — verify redirect to `/dashboard`.
  - Register as **Mentor / Senior** (`role = MENTOR`) — verify instant approval and redirect to `/mentor/profile`.
- [ ] **Resume Builder**:
  - Test "Upload & Auto-Fill Resume" and PDF export.
- [ ] **AlgoRank**:
  - Open a problem, select Python/JavaScript/C++, and click **Run Code** (tests Piston API execution).
- [ ] **AI Mock Interview**:
  - Start an interview session with webcam and microphone enabled.
  - Verify that face proctoring and emotion recognition send frames to Hugging Face Space without error.
- [ ] **Senior Connect**:
  - As mentor: Add availability slots or use 1-click slot presets.
  - As candidate: Book a session.
  - Test the **In-Page Video Meeting** (Jitsi Meet) and **Real-Time Session Chat**.

---

## Troubleshooting Common Issues

### 1. Render API cold start timeout (504 Gateway Timeout)
- **Cause**: Render's free tier spins down web services after 15 minutes of inactivity. The first wake-up request takes ~45–60 seconds.
- **Solution**: Wait 60 seconds and refresh. For 24/7 uptime, ping `/health` every 10 minutes using a free monitor like [Cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com), or upgrade to Render Starter plan ($7/mo).

### 2. Hugging Face Space is sleeping
- **Cause**: Free Hugging Face Spaces sleep after 48 hours of inactivity.
- **Solution**: The first request to the Space automatically awakens it. You can set up a free 24-hour ping to `https://<your-space>.hf.space/health` to keep it active.

### 3. CORS Error: "Origin is not allowed by CORS"
- **Cause**: The browser origin does not match `CLIENT_ORIGIN` in the backend.
- **Solution**:
  - Check Render environment variable `CLIENT_ORIGIN`.
  - Ensure there is **NO trailing slash** (use `https://careerhub.vercel.app`, not `https://careerhub.vercel.app/`).
  - If using Vercel preview deployments, add them comma-separated: `https://careerhub.vercel.app,https://careerhub-git-main.vercel.app`.

### 4. Prisma Migration Fails on Render (`P1001: Can't reach database`)
- **Cause**: Connection string lacks SSL mode or pooler timeout.
- **Solution**:
  - Ensure `DIRECT_URL` in Render points to Neon's unpooled connection string with `?sslmode=require`.
  - Ensure `DATABASE_URL` points to Neon's pooled string with `?sslmode=require`.

### 5. AlgoRank Code Execution Error: "PISTON_API_URL must use HTTPS in production"
- **Cause**: Backend security policy enforces HTTPS for remote code sandbox execution in production.
- **Solution**: Set `PISTON_API_URL` to `https://emkc.org/api/v2/piston/execute`.

---

## Deployment File Summary

| File Path | Description | Target Platform |
|---|---|---|
| `render.yaml` | Blueprint specifying build commands, migrations, health check, and environment variables | Render |
| `vercel.json` | Single-Page Application routing and edge API rewrite destination | Vercel |
| `services/proctoring/Dockerfile` | Python 3.11, CPU PyTorch, OpenCV, user 1000, port 7860 | Hugging Face Spaces |
| `services/proctoring/README.md` | YAML frontmatter (`sdk: docker`, `app_port: 7860`) | Hugging Face Spaces |
| `services/proctoring/.dockerignore` | Build ignore rules for ML service | Hugging Face Spaces |
| `scripts/deploy-hf-space.ps1` | 1-Click sync & push script for Windows PowerShell | Hugging Face Spaces |
| `scripts/deploy-hf-space.sh` | 1-Click sync & push script for Linux / macOS / WSL | Hugging Face Spaces |
| `apps/api/Dockerfile` | Production Node.js 22 + Prisma multi-stage container | Docker / VPS / Railway |
| `apps/web/Dockerfile` & `nginx.conf` | React 18 production build with Nginx reverse proxy | Docker / VPS / Coolify |
| `docker-compose.prod.yml` | Full-stack production orchestration | Local / VPS / Self-hosted |
