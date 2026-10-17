# CareerHub

CareerHub is an end-to-end placement preparation platform that brings career-building tools together in one application. Students can practice coding, build stronger resumes, prepare for interviews, connect with alumni mentors, and create personalized learning roadmaps.

## Features

- **AlgoRank:** Practice data structures and algorithms with searchable problems, an in-browser editor, code execution, submissions, playlists, discussions, and leaderboards.
- **Resume Builder:** Create and manage resumes with guided editing, reusable templates, and AI-assisted writing tools.
- **AI Interview Preparation:** Practice interview skills and receive structured feedback as part of a broader placement-preparation workflow.
- **Senior Connect:** Discover alumni mentors, manage mentor profiles and availability, request sessions, and keep track of mentorship activity.
- **AI Roadmaps:** Build and track personalized learning plans for career goals.
- **Unified accounts and dashboard:** Access platform tools through a shared account, with role-aware experiences for users, administrators, and approved mentors.

CareerHub is designed to support the complete preparation journey, from practicing technical skills to getting guidance from experienced alumni.

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
- **API:** Node.js, Express
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based authentication and role-aware access
- **Code execution:** Piston integration for AlgoRank
- **AI integrations:** OpenRouter-compatible model API for AI-assisted features
- **Repository:** npm workspaces monorepo

## Repository structure

```text
CareerHub/
├── apps/
│   ├── api/                 # Express API and Prisma database schema
│   └── web/                 # React and TypeScript frontend
├── packages/
│   └── shared/              # Shared authentication utilities
├── services/                # Supporting services
├── docs/                    # Architecture, module, and progress documentation
├── docker-compose.yml       # Local PostgreSQL service
└── package.json             # Workspace scripts and dependencies
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL 15, either locally or through Neon
- Docker Compose, if running the included local PostgreSQL container

### 1. Install dependencies

From the repository root:

```bash
npm install
```

### 2. Configure the database

For local development, start PostgreSQL:

```bash
docker compose up -d postgres
```

The included Compose configuration creates a local database named `careerhub`. Alternatively, use a PostgreSQL connection string from Neon or another PostgreSQL provider.

Create the API environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set at least:

```dotenv
DATABASE_URL="postgresql://careerhub:careerhub_password@localhost:5432/careerhub"
JWT_SECRET="replace-this-with-a-long-random-secret"
```

For Neon, set `DATABASE_URL` to the provider's PostgreSQL connection URL. Keep credentials and API keys private; do not commit `.env` files.

### 3. Apply migrations and generate the Prisma client

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd ../..
```

### 4. Configure optional integrations

Add credentials or service URLs to `apps/api/.env` when you want to use the corresponding feature:

| Variable | Used for |
| --- | --- |
| `OPENROUTER_API_KEY` | AI-assisted writing and roadmap generation |
| `MODEL_NAME` | Configuring the model used by AI features |
| `IMAGEKIT_PUBLIC_KEY` | Resume image uploads |
| `IMAGEKIT_PRIVATE_KEY` | Resume image uploads |
| `IMAGEKIT_URL_ENDPOINT` | Resume image uploads |
| `PISTON_API_URL` | AlgoRank code execution service |

### 5. Run CareerHub

From the repository root:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5000`.

## Useful commands

Run these from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API and frontend for local development |
| `npm run dev:web` | Start only the frontend |
| `npm run dev:api` | Start only the API |
| `npm run build` | Build all workspaces |
| `npm run build:web` | Build the frontend |
| `npm run build:api` | Run the API workspace build step |
| `npm run lint` | Run workspace linters |

Additional Prisma commands can be run from `apps/api`:

```bash
npx prisma migrate status
npx prisma studio
```

## Security

- Use a unique, strong `JWT_SECRET` outside local development.
- Keep database connection strings and integration keys out of source control.
- Mentor accounts are granted through administrator approval.
- Never expose privileged credentials in frontend code.

## Project documentation

Further architecture and module documentation is available in the [`docs`](docs/) directory.
