export const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 48; // 48 hours

export function getStaleCutoffDate(reference: number = Date.now()): Date {
  return new Date(reference - STALE_THRESHOLD_MS);
}
