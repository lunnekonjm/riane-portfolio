'use client';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { SalaryRecord, RevenueConfig, ReserveAllocation, ExtraCashEntry } from '@/types/revenue';
import { getDb, sanitizeForFirestore } from './firestoreCore';

// ── Salary Records (Revenu & Budget — porté depuis AuraBudget Pro) ──

export async function getSalaryRecords(uid: string): Promise<SalaryRecord[]> {
  const db = getDb();
  const q = query(collection(db, 'users', uid, 'salary'), orderBy('period', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SalaryRecord));
}

export async function saveSalaryRecord(uid: string, record: SalaryRecord): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'salary', record.id), sanitizeForFirestore({ ...record, updatedAt: Date.now() }));
}

export async function deleteSalaryRecord(uid: string, recordId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'users', uid, 'salary', recordId));
}

export async function getRevenueConfig(uid: string): Promise<RevenueConfig | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'users', uid, 'settings', 'revenueConfig'));
  return snap.exists() ? (snap.data() as RevenueConfig) : null;
}

export async function saveRevenueConfig(uid: string, config: RevenueConfig): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'settings', 'revenueConfig'), sanitizeForFirestore(config));
}

// ── Réserve primes / rachats (allocation manuelle, hors DCA régulier) ──

export async function getReserveAllocations(uid: string): Promise<ReserveAllocation[]> {
  const db = getDb();
  const q = query(collection(db, 'users', uid, 'reserveAllocations'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReserveAllocation));
}

export async function saveReserveAllocation(uid: string, allocation: ReserveAllocation): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'reserveAllocations', allocation.id), sanitizeForFirestore(allocation));
}

export async function deleteReserveAllocation(uid: string, allocationId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'users', uid, 'reserveAllocations', allocationId));
}

// ── Primes, Tontines & Extras de Trésorerie (Windfalls) ──

export async function getExtraCashEntries(uid: string): Promise<ExtraCashEntry[]> {
  const db = getDb();
  const q = query(collection(db, 'users', uid, 'extraCash'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExtraCashEntry));
}

export async function saveExtraCashEntry(uid: string, entry: ExtraCashEntry): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, 'users', uid, 'extraCash', entry.id), sanitizeForFirestore({ ...entry, updatedAt: Date.now() }));
}

export async function deleteExtraCashEntry(uid: string, entryId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'users', uid, 'extraCash', entryId));
}
