import { QuotaKind, MODEL_REGISTRY } from '../types/modelRegistry';
import { getPacificDateString } from './resetSchedule';

interface QuotaState {
  minuteCount: number;
  dayCount: number;
  dayDate: string;
  cooldownUntilPacificDate?: string;
}

const STORAGE_PREFIX = 'riane_quota_router_v1_';

function getStorageKey(modelId: string, quotaKind: QuotaKind): string {
  return `${STORAGE_PREFIX}${modelId}_${quotaKind}`;
}

export function loadModelQuota(modelId: string, quotaKind: QuotaKind): QuotaState {
  const today = getPacificDateString();
  if (typeof window === 'undefined') {
    return { minuteCount: 0, dayCount: 0, dayDate: today };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(modelId, quotaKind));
    if (raw) {
      const parsed = JSON.parse(raw) as QuotaState;
      if (parsed.dayDate !== today) {
        return { minuteCount: 0, dayCount: 0, dayDate: today };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return { minuteCount: 0, dayCount: 0, dayDate: today };
}

export function saveModelQuota(modelId: string, quotaKind: QuotaKind, state: QuotaState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(modelId, quotaKind), JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('riane_quota_updated'));
  } catch { /* ignore */ }
}

export function hasModelQuota(modelId: string, quotaKind: QuotaKind): boolean {
  const model = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (!model || model.knownUnavailable) return false;

  const limits = model.quotas[quotaKind];
  if (!limits) return false;

  const state = loadModelQuota(modelId, quotaKind);
  const today = getPacificDateString();

  if (state.cooldownUntilPacificDate === today) return false;
  if (limits.rpd !== null && state.dayCount >= limits.rpd) return false;
  if (limits.rpm !== null && state.minuteCount >= limits.rpm) return false;

  return true;
}

export async function recordModelUsage(
  modelId: string,
  quotaKind: QuotaKind,
  outcome: 'success' | 'quota-error'
): Promise<void> {
  const today = getPacificDateString();
  const state = loadModelQuota(modelId, quotaKind);

  if (outcome === 'quota-error') {
    state.cooldownUntilPacificDate = today;
    saveModelQuota(modelId, quotaKind, state);
    return;
  }

  state.dayCount += 1;
  state.minuteCount += 1;
  saveModelQuota(modelId, quotaKind, state);

  setTimeout(() => {
    const curState = loadModelQuota(modelId, quotaKind);
    if (curState.minuteCount > 0) {
      curState.minuteCount -= 1;
      saveModelQuota(modelId, quotaKind, curState);
    }
  }, 60000);
}
