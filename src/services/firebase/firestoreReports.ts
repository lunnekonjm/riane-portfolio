'use client';

import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getDb } from './firestoreCore';

// ── Periodic Reports (historique partagé, y compris ceux générés par le cron) ──

export interface SavedReportRecord {
  id: string;
  period: string;
  title: string;
  dateStr: string;
  timestamp: number;
  content: string;
  generatedBy?: 'user' | 'cron';
}

export async function getReports(uid: string, maxEntries = 30): Promise<SavedReportRecord[]> {
  const db = getDb();
  const q = query(collection(db, 'users', uid, 'reports'), orderBy('timestamp', 'desc'), limit(maxEntries));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedReportRecord));
}

export async function saveReport(uid: string, report: SavedReportRecord): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'reports', report.id), report);
}

export async function deleteAllReports(uid: string, reportIds: string[]): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  reportIds.forEach((id) => batch.delete(doc(db, 'users', uid, 'reports', id)));
  await batch.commit();
}
