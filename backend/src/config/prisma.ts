import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Locate dev.db reliably regardless of whether running from src/ or dist/ or root
function getSqliteUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl; // Non-sqlite e.g. postgresql://
  }

  const potentialPaths = [
    path.resolve(__dirname, '../../prisma/dev.db'),
    path.resolve(__dirname, '../prisma/dev.db'),
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), 'backend/prisma/dev.db'),
    path.resolve(process.cwd(), 'dev.db'),
    path.resolve(process.cwd(), 'backend/dev.db'),
  ];

  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      const cleanPath = p.replace(/\\/g, '/');
      return `file:${cleanPath}`;
    }
  }

  // Fallback
  return `file:${path.resolve(process.cwd(), 'prisma/dev.db').replace(/\\/g, '/')}`;
}

const dbUrl = getSqliteUrl();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: ['warn', 'error'],
});

export default prisma;
