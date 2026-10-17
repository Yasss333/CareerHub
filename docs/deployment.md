# Production deployment

CareerHub is an npm-workspaces monorepo. Deploy the repository root as the Vercel project so its build can access the shared workspace package. Deploy the Express API from the same repository on Render and connect it to Neon Postgres.

## 1. Create the Neon database

Create a Neon project and database. Copy both connection strings from its Connect panel:

- `DATABASE_URL`: pooled connection string. Its hostname contains `-pooler`; use this for the running API.
- `DIRECT_URL`: direct, unpooled connection string; use this for Prisma migrations.

Both connection strings should use TLS (`sslmode=require`). Keep the Neon compute region close to the Render service region. Prisma 6 reads `DATABASE_URL` for application queries and `DIRECT_URL` for migration commands.

## 2. Create the Render API service

Connect the Git repository to Render and create a Blueprint from the repository's `render.yaml`. Keep the service name `careerhub-api` so the Vercel API proxy destination matches. If Render assigns a different `onrender.com` hostname, update the API destination in `vercel.json` to that exact HTTPS URL.

Set these prompted environment values in Render:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon pooled URL (`-pooler`) |
| `DIRECT_URL` | Neon direct/unpooled URL |
| `CLIENT_ORIGIN` | Exact Vercel origin, e.g. `https://careerhub.vercel.app`; comma-separate any additional production domains |
| `PISTON_API_URL` | Your deployed Piston HTTPS endpoint, including `/api/v2/execute` |

Render generates `JWT_SECRET` from the Blueprint. Do not reuse the local development JWT secret. The API rejects production startup if required variables are missing, the JWT secret is too short, or Piston is configured with HTTP.

Optional integrations can be configured in Render when needed:

- `OPENROUTER_API_KEY` and `MODEL_NAME` enable AI-assisted resume and roadmap features.
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT` enable profile-photo and resume image uploads.

The Blueprint builds the API, generates the Prisma client, applies committed migrations, and starts Express. The Render health check uses `/health/ready`, which verifies the database connection. Express binds to Render's `PORT` on `0.0.0.0` and handles `SIGTERM` shutdowns.

The Blueprint uses Render's Free plan to avoid choosing a paid service on your behalf. Render Free services spin down when idle and are intended for evaluation rather than production availability. Change `plan` in `render.yaml` to a paid plan for a production service; Render's pre-deploy migration command is available on paid services, while this Blueprint runs `prisma migrate deploy` in the build command.

## 3. Create the Vercel frontend project

Import the same repository into Vercel with:

- **Root directory:** repository root (leave it as `.`)
- **Framework:** Vite
- **Install command:** `npm ci`
- **Build command:** `npm run build:web`
- **Output directory:** `apps/web/dist`

`vercel.json` contains these build settings, an SPA fallback for client-side routes, and an external rewrite that sends `/api/*` to `https://careerhub-api.onrender.com/api/*`. Browser requests use same-origin `/api` paths, so no frontend API secret or `VITE_*` URL is needed. If you change the Render hostname, also update this rewrite destination.

After Vercel assigns the frontend domain, add that exact origin to Render's `CLIENT_ORIGIN`, then redeploy the API. Include your custom domain there if you use one. Vercel preview domains are not automatically allowed by the API's origin allowlist.

## 4. First deployment and data

Deploy Render first, then Vercel. On the first Render build, `prisma migrate deploy` applies the checked-in migrations to Neon. Do not use `prisma migrate dev` against production. This deploy does not copy records from the local Docker database; export/import local data separately if you need it.

Piston must be reachable from Render over HTTPS. Test the deployed API at `/health` and `/health/ready`; the latter should report `database: connected`. Vercel routes the application's `/api/*` calls to Render; health endpoints themselves are `/health` and `/health/ready`.

Local Vite development continues to proxy `/api` requests to `http://localhost:5000`. Keep production secrets only in Render's environment settings and never commit `.env` files.

## 5. Deploy the AI Interview ML service (Hugging Face Spaces)

The multimodal ML proctoring service requires 2-4GB RAM (running ViT, Wav2Vec2, and FaceNet), which exceeds free web app limits (e.g. 512MB on Render). Deploy it to a free 16GB RAM Hugging Face Space using Docker:

1. Create a new Space on [Hugging Face Spaces](https://huggingface.co/new-space).
2. Set Space SDK to **Docker** (Blank template) and Hardware to **CPU basic (16GB RAM Free)**.
3. Push or upload the `services/proctoring` folder to the Space repository:
   - Use the 1-click helper script: `.\scripts\deploy-hf-space.ps1 -SpaceRepoUrl "<your-space-git-url>"` (or `./scripts/deploy-hf-space.sh` on Linux/Mac).
   - Or upload files via Hugging Face Web UI Files tab (`Dockerfile`, `README.md`, `requirements.txt`, `server.py`, etc.).
4. In Space **Settings > Variables and secrets**, add a secret:
   - `INTERVIEW_ML_TOKEN`: A private secret shared with the Express backend.
5. In your Render API service environment variables, configure:
   - `INTERVIEW_ML_URL`: `https://<your-username>-<space-name>.hf.space`
   - `INTERVIEW_ML_TOKEN`: The same private token configured in step 4.

The backend will automatically proxy candidate video frames, audio clips, and transcripts to this Hugging Face endpoint while preserving ephemeral, owner-scoped proctoring state.

## 6. Complete Guide and Docker Alternatives

For full step-by-step instructions with troubleshooting and smoke-testing checklists, see [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md).

If deploying to a single server or VPS using Docker:
- Full-stack production orchestration: `docker compose -f docker-compose.prod.yml up -d --build`
- Backend API Dockerfile: `apps/api/Dockerfile`
- Frontend Web Dockerfile & Nginx: `apps/web/Dockerfile`, `apps/web/nginx.conf`
- ML Service Dockerfile: `services/proctoring/Dockerfile`

## Deployment references

- [Comprehensive CareerHub Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Vercel external rewrites](https://vercel.com/docs/routing/rewrites)
- [Render Blueprints](https://render.com/docs/blueprint-spec)
- [Render health checks](https://render.com/docs/health-checks)
- [Neon with Prisma](https://neon.com/docs/guides/prisma)
- [Hugging Face Spaces Docker SDK](https://huggingface.co/docs/hub/spaces-sdks-docker)

