// Trusted operator command. Credentials must be supplied explicitly through the environment.
import '../apps/api/src/load-env.js';
import bcrypt from 'bcryptjs';
import {PrismaClient} from '@prisma/client';

const email = process.env.CAREERHUB_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.CAREERHUB_ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8 || password.length > 72) throw new Error('Set CAREERHUB_ADMIN_EMAIL and CAREERHUB_ADMIN_PASSWORD (8–72 characters) explicitly.');
const db = new PrismaClient();
try {
  const existing = await db.user.findUnique({where: {email}});
  if (existing && !await bcrypt.compare(password, existing.passwordHash)) throw new Error('An account already exists with a different password. No changes made.');
  if (existing && existing.role !== 'ADMIN') throw new Error('An existing ordinary account cannot be promoted by this bootstrap command. Review its identity separately.');
  const user = existing || await db.user.create({data: {email, passwordHash: await bcrypt.hash(password, 12), name: 'CareerHub Admin', role: 'ADMIN', interests: [], goals: [], badges: []}});
  console.log(JSON.stringify({provisioned: true, email: user.email, role: user.role, created: !existing}));
} finally {await db.$disconnect();}
