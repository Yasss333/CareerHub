import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import connectRoutes from './routes/connect.routes.js';
import aiRoutes from './routes/ai.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import algorankRoutes from './routes/algorank.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

const denyMentorPlatformAccess = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next();

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) return next();
    console.error('Mentor role verification error:', error);
    return res.status(500).json({ error: 'Failed to verify account access' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { role: true }
    });

    if (user?.role === 'MENTOR') {
      return res.status(403).json({ error: 'This account can only access Senior Connect' });
    }

    return next();
  } catch (error) {
    console.error('Mentor role lookup error:', error);
    return res.status(500).json({ error: 'Failed to verify account access' });
  }
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:54046', 'http://localhost:54046'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CareerHub API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use(['/api/resume', '/api/ai', '/api/pdf', '/api/algorank', '/api/roadmaps'], denyMentorPlatformAccess);
app.use('/api/resume', resumeRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/algorank', algorankRoutes);
app.use('/api/roadmaps', roadmapRoutes);
// app.use('/api/interview', interviewRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`CareerHub API running on port ${PORT}`);
});