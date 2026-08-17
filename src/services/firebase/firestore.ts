'use client';

/**
 * Barrel export facade for Firestore services.
 * Re-exports core, revenue, and reports sub-services with 0 breaking changes.
 */

export * from './firestoreCore';
export * from './firestoreRevenue';
export * from './firestoreReports';
