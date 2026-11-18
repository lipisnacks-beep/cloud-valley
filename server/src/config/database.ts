import mongoose from 'mongoose';
import { env } from './env.ts';

let mongoConnected = false;

export async function connectDatabase(): Promise<{ mode: 'mongodb' | 'local' }> {
  if (!env.MONGODB_URI) {
    console.info(
      '[Database] MONGODB_URI not set. Using local JSON persistence (.data/cloud_valley.json). Set MONGODB_URI to connect MongoDB Atlas.'
    );
    mongoConnected = false;
    return { mode: 'local' };
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'cloud_valley',
      serverSelectionTimeoutMS: 6000,
    });
    mongoConnected = true;
    console.info('[Database] Connected to MongoDB Atlas (database: cloud_valley)');
    return { mode: 'mongodb' };
  } catch (error) {
    console.error('[Database] MongoDB Atlas connection failed, falling back to local persistence:', error);
    mongoConnected = false;
    return { mode: 'local' };
  }
}

export function isMongoConnected(): boolean {
  return mongoConnected && mongoose.connection.readyState === 1;
}
