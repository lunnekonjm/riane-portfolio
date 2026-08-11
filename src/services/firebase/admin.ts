/**
 * Firebase Admin — accès serveur (routes API, cron), sans session utilisateur.
 * Utilisé uniquement par les routes qui tournent hors contexte navigateur
 * (ex: /api/cron/periodic-review). Nécessite FIREBASE_SERVICE_ACCOUNT_KEY.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY manquante — requise pour les routes serveur (cron).');
  }

  const serviceAccount = JSON.parse(rawKey);

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });
  return adminApp;
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
