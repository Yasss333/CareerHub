# Resume_Builder

### AI-Powered Resume Builder for Fast, Modern, and Professional Resumes

Resume_Builder is a full-stack, AI-based resume builder that helps users create visually appealing, well-structured resumes quickly using AI assistance. The platform focuses on fast development, clean UI/UX, and flexible resume customization with multiple templates and resume versions.

---

## Key Features

- AI-powered resume generation (professional summary, experience enhancement)
- Form-based resume creation workflow
- Multiple modern resume templates
- Multiple resume versions per user
- PDF-friendly resume preview and export flow
- Resume visibility control with public/private sharing
- Public resume browser on dashboard for viewing shared resumes
- Profile photo upload and processing support
- JWT-based authentication with secure password hashing

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Redux Toolkit

### Backend
- Node.js
- Express
- MongoDB + Mongoose

### AI & Integrations
- OpenRouter/OpenAI SDK
- Google Generative AI SDK
- ImageKit

### Authentication
- JSON Web Token (JWT)
- bcrypt

---

## Project Structure

```text
Resume_Builder/
  client/   # React + Vite frontend
  server/   # Node + Express backend
```

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas or local MongoDB instance

### 1) Clone the Repository

```bash
git clone <your-github-repo-link>
cd Resume_Builder
```

### 2) Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3) Configure Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

OPENROUTER_API_KEY=your_openrouter_api_key
MODEL_NAME=gpt-4o-mini
```

Create `client/.env`:

```env
VITE_BASE_URL=http://localhost:5000
```

### 4) Run the App

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

Frontend usually runs at `http://localhost:5173` and backend at `http://localhost:5000`.

---

## API Base Routes

- `/api/user`
- `/api/resume`
- `/api/ai`

---

## My Role & Contribution

- Built the project solo
- Primary focus: frontend development
- Designed and implemented complete UI/UX flow
- Built custom Tailwind-based styling 
- Implemented resume templates and layout system
- Integrated AI-generated content into the resume workflow
- Worked on authentication and backend API integration

---

## Notes

- Do not commit `.env` files or API keys.
- Rotate any keys that were exposed during development.
