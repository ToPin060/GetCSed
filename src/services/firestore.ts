import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import env from './config.js';
import { fromJsonString } from '../utils/json.js';

initializeApp({
  credential: cert(fromJsonString<any>(Buffer.from(env.google.cert, 'base64').toString('utf-8')) as any),
});

const db = getFirestore();
export { db };

export const availabilitiesId = env.nodeEnv === "prod" ? 'availabilities' : 'dev-availabilities';
