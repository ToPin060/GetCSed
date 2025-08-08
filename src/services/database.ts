import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import environment from './config.js';
import { fromJsonString } from '../utils/json.js';

initializeApp({
  credential: cert(fromJsonString<any>(Buffer.from(environment.google.cert, 'base64').toString('utf-8')) as any),
});

const db = getFirestore();
export { db };

export const availabilitiesId = environment.nodeEnv === "prod" ? 'availabilities' : 'dev-availabilities';
export const steamInfoId = environment.nodeEnv === "prod" ? 'ranks' : 'dev-ranks';
