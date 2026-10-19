import './load-env.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import connectRoutes from './routes/connect.routes.js';
import aiRoutes from './routes/ai.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import algorankRoutes from './routes/algorank.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import achievementRoutes from './routes/achievement.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import { cleanupStaleLiveSessions } from './services/livekit.service.js';

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'careerhub-super-secret-jwt-key-2024';

if (process.env.NODE_ENV === 'production') {
  const required = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'CLIENT_ORIGIN', 'PISTON_API_URL'];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    console.error(`Missing required production environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (JWT_SECRET === 'careerhub-super-secret-jwt-key-2024' || JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be a unique secret with at least 32 characters in production.');
    process.exit(1);
  }
  if (!process.env.PISTON_API_URL.startsWith('https://')) {
    console.error('PISTON_API_URL must use HTTPS in production.');
    process.exit(1);
  }
}

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
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:54046',
  'http://localhost:54046',
  'https://careerhub-navy.vercel.app',
  ...(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
]);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.has(cleanOrigin)) return true;
  // Support Vercel production and branch preview deployments for CareerHub
  if (/^https:\/\/(careerhub|careerhub-navy).*\.vercel\.app$/i.test(cleanOrigin)) {
    return true;
  }
  return false;
};

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Root status
app.get('/', (req, res) => {
  res.json({
    name: 'CareerHub API',
    status: 'online',
    version: '1.0.0',
    health: '/health',
    ready: '/health/ready'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CareerHub API is running' });
});

app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Readiness check failed:', error.message);
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use(['/api/resume', '/api/ai', '/api/pdf', '/api/algorank', '/api/roadmaps', '/api/dashboard', '/api/interview'], denyMentorPlatformAccess);
app.use('/api/resume', resumeRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/algorank', algorankRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const ensureDatabaseSeeded = async () => {
  try {
    const problemCount = await prisma.problem.count();
    if (problemCount === 0) {
      console.log('🌱 No problems found in database. Automatically running seedDatabase...');
      const { seedDatabase } = await import('../prisma/seed.js');
      const result = await seedDatabase(prisma);
      console.log('✅ Auto-seed completed successfully:', result);
    } else {
      console.log(`📊 AlgoRank database contains ${problemCount} problems.`);
    }
  } catch (error) {
    console.error('⚠️ Database auto-seed check encountered an issue:', error.message);
  }
};

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`CareerHub API running on port ${PORT}`);
  ensureDatabaseSeeded();
});

const liveSessionCleanupTimer = setInterval(() => {
  cleanupStaleLiveSessions(prisma).catch((error) => {
    console.error('Live session cleanup failed:', error.message);
  });
}, 60_000);
liveSessionCleanupTimer.unref();

const shutdown = (signal) => {
  console.log(`${signal} received; closing HTTP server.`);
  clearInterval(liveSessionCleanupTimer);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
