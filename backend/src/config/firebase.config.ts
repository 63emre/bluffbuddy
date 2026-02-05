/**
 * ==========================================================
 * FIREBASE CONFIGURATION
 * ==========================================================
 * BluffBuddy Online - Firebase Admin SDK Configuration
 *
 * @owner DEV3 (Social/Auth)
 * @version v0.2.0
 * @see docs/v0.1.0/02-Architecture.md
 *
 * USAGE:
 * ```typescript
 * const projectId = this.configService.get<string>('firebase.projectId');
 * const credentials = this.configService.get<FirebaseCredentials>('firebase.credentials');
 * ```
 *
 * ENVIRONMENT VARIABLES:
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_CLIENT_EMAIL: Service account email
 * - FIREBASE_PRIVATE_KEY: Service account private key (base64 or raw)
 * - FIREBASE_DATABASE_URL: Realtime Database URL (optional)
 * - FIREBASE_SERVICE_ACCOUNT_PATH: Path to service account JSON (alternative)
 * ==========================================================
 */

import { registerAs } from '@nestjs/config';
import * as fs from 'fs';

/**
 * Firebase Credentials Schema
 */
export interface FirebaseCredentials {
  /** Service account client email */
  clientEmail: string;
  /** Service account private key */
  privateKey: string;
}

/**
 * Firebase Configuration Schema
 */
export interface FirebaseConfig {
  /** Firebase project ID */
  projectId: string;
  /** Service account credentials */
  credentials: FirebaseCredentials | null;
  /** Realtime Database URL (optional) */
  databaseUrl: string | null;
  /** Storage bucket name */
  storageBucket: string | null;
  /** Path to service account JSON file */
  serviceAccountPath: string | null;
}

/**
 * Parse private key from environment
 * Handles both base64-encoded and raw PEM format
 */
function parsePrivateKey(key: string | undefined): string {
  if (!key) return '';

  // Check if base64 encoded
  if (!key.includes('-----BEGIN')) {
    try {
      return Buffer.from(key, 'base64').toString('utf-8');
    } catch {
      return key;
    }
  }

  // Handle escaped newlines
  return key.replace(/\\n/g, '\n');
}

/**
 * Load credentials from service account file if path provided
 */
function loadServiceAccountCredentials(
  path: string | undefined,
): FirebaseCredentials | null {
  if (!path || !fs.existsSync(path)) return null;

  try {
    const content = fs.readFileSync(path, 'utf-8');
    const serviceAccount = JSON.parse(content);
    return {
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    };
  } catch {
    console.warn(`Failed to load Firebase service account from: ${path}`);
    return null;
  }
}

/**
 * Firebase Configuration Factory
 * Registered under 'firebase' namespace
 */
export const firebaseConfig = registerAs('firebase', (): FirebaseConfig => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null;
  const fileCredentials = loadServiceAccountCredentials(
    serviceAccountPath ?? undefined,
  );

  // Environment variables take precedence over file
  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL || fileCredentials?.clientEmail || '';
  const privateKey =
    parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY) ||
    fileCredentials?.privateKey ||
    '';

  return {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    credentials: clientEmail && privateKey ? { clientEmail, privateKey } : null,
    databaseUrl: process.env.FIREBASE_DATABASE_URL || null,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
    serviceAccountPath,
  };
});
