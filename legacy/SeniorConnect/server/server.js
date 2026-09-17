require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const seniorRoutes = require('./routes/seniors');
const sessionRoutes = require('./routes/sessions');
const availabilityRoutes = require('./routes/availability');
const profileRoutes = require('./routes/profile');
const credibilityRoutes = require('./routes/credibility');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/seniors', seniorRoutes);
app.use('/sessions', sessionRoutes);
app.use('/availability', availabilityRoutes);
app.use('/profile', profileRoutes);
app.use('/credibility', credibilityRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Database + start ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
