'use client';

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  writeBatch,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseApp } from './config';
import type { Position, PortfolioConfig, AuditLogEntry, InvestorProfile } from '@/types/portfolio';
import type { AnalysisResult } from '@/types/analysis';
import type { Recommendation, ThesisCard } from '@/types/recommendation';

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

// ── Portfolio Positions ──

export async function getPositions(uid: string): Promise<Position[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'portfolio'), orderBy('envelope'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Position));
}

export async function savePosition(uid: string, position: Position): Promise<void> {
  const db = getDb();
  const ref = doc(db, 'users', uid, 'portfolio', position.id);
  await setDoc(ref, { ...position, updatedAt: Date.now() });
}

export async function saveAllPositions(uid: string, positions: Position[]): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  positions.forEach((pos) => {
    const ref = doc(db, 'users', uid, 'portfolio', pos.id);
    batch.set(ref, { ...pos, updatedAt: Date.now() });
  });
  await batch.commit();
}

export async function deletePosition(uid: string, positionId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'users', uid, 'portfolio', positionId));
}

// ── Portfolio Config ──

export async function getPortfolioConfig(uid: string): Promise<PortfolioConfig | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'users', uid, 'config', 'portfolio'));
  if (!snap.exists()) return null;
  return snap.data() as PortfolioConfig;
}

export async function savePortfolioConfig(uid: string, config: PortfolioConfig): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'config', 'portfolio'), config);
}

// ── Investor Profile ──

export async function getInvestorProfile(uid: string): Promise<InvestorProfile | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'users', uid, 'config', 'investorProfile'));
  if (!snap.exists()) return null;
  return snap.data() as InvestorProfile;
}

export async function saveInvestorProfile(uid: string, profile: InvestorProfile): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'config', 'investorProfile'), { ...profile, updatedAt: Date.now() });
}

// ── Audit Log ──

export async function addAuditEntry(uid: string, entry: Omit<AuditLogEntry, 'id'>): Promise<string> {
  const db = getDb();
  const ref = await addDoc(collection(db, 'users', uid, 'audit-log'), entry);
  return ref.id;
}

export async function getAuditLog(uid: string, maxEntries = 50): Promise<AuditLogEntry[]> {
  const db = getDb();
  const q = query(
    collection(db, 'users', uid, 'audit-log'),
    orderBy('timestamp', 'desc'),
    limit(maxEntries)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLogEntry));
}

// ── Recommendations ──

export async function saveRecommendation(uid: string, rec: Recommendation): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'recommendations', rec.id), rec);
}

export async function getActiveRecommendations(uid: string): Promise<Recommendation[]> {
  const db = getDb();
  const q = query(
    collection(db, 'users', uid, 'recommendations'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  const now = Date.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Recommendation))
    .filter((r) => r.expiresAt > now);
}

// ── Thesis Cards ──

export async function saveThesis(uid: string, thesis: ThesisCard): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'theses', thesis.id), thesis);
}

export async function getTheses(uid: string): Promise<ThesisCard[]> {
  const db = getDb();
  const q = query(
    collection(db, 'users', uid, 'theses'),
    orderBy('lastUpdated', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ThesisCard));
}

// ── Analyses History ──

export async function saveAnalysis(uid: string, analysis: AnalysisResult): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'analyses', analysis.id), analysis);
}

export async function getAnalyses(uid: string, maxEntries = 20): Promise<AnalysisResult[]> {
  const db = getDb();
  const q = query(
    collection(db, 'users', uid, 'analyses'),
    orderBy('completedAt', 'desc'),
    limit(maxEntries)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnalysisResult));
}

// ── Initialize default data ──

export async function initializeUserData(uid: string): Promise<void> {
  const config = await getPortfolioConfig(uid);
  if (config) return; // Already initialized

  const defaultConfig: PortfolioConfig = {
    monthlyBudget: 1000,
    annualCTOBudget: 8000,
    annualSpeculativeCap: 2000,
    riskProfile: 'dynamic',
    noLeverage: true,
    rebalanceByFlows: true,
    baseCurrency: 'EUR',
    horizonYears: 15,
  };

  await savePortfolioConfig(uid, defaultConfig);
}
