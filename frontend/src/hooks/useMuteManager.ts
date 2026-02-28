import { useCallback } from 'react';

const MUTE_STORAGE_KEY = 'globalchat_mutes';
const MUTE_DURATION_MS = 10 * 60 * 1000; // 10 minutes default

interface MuteRecord {
  expiresAt: number;
  reason?: string;
}

interface MuteMap {
  [username: string]: MuteRecord;
}

function loadMutes(): MuteMap {
  try {
    const raw = localStorage.getItem(MUTE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MuteMap;
  } catch {
    return {};
  }
}

function saveMutes(mutes: MuteMap): void {
  localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify(mutes));
}

function pruneExpiredMutes(mutes: MuteMap): MuteMap {
  const now = Date.now();
  const pruned: MuteMap = {};
  for (const [username, record] of Object.entries(mutes)) {
    if (record.expiresAt > now) {
      pruned[username] = record;
    }
  }
  return pruned;
}

export function getActiveMutes(): Array<{ username: string; expiresAt: number; reason?: string }> {
  const mutes = pruneExpiredMutes(loadMutes());
  saveMutes(mutes);
  return Object.entries(mutes).map(([username, record]) => ({
    username,
    expiresAt: record.expiresAt,
    reason: record.reason,
  }));
}

export function useMuteManager() {
  const isUserMuted = useCallback((username: string): boolean => {
    const mutes = pruneExpiredMutes(loadMutes());
    saveMutes(mutes);
    return !!mutes[username] && mutes[username].expiresAt > Date.now();
  }, []);

  const muteUser = useCallback((username: string, durationMs?: number, reason?: string): void => {
    const mutes = pruneExpiredMutes(loadMutes());
    mutes[username] = {
      expiresAt: Date.now() + (durationMs ?? MUTE_DURATION_MS),
      reason,
    };
    saveMutes(mutes);
  }, []);

  const unmuteUser = useCallback((username: string): void => {
    const mutes = loadMutes();
    delete mutes[username];
    saveMutes(mutes);
  }, []);

  const getRemainingMuteMs = useCallback((username: string): number => {
    const mutes = loadMutes();
    const record = mutes[username];
    if (!record) return 0;
    const remaining = record.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }, []);

  const getRemainingMuteMinutes = useCallback((username: string): number => {
    return Math.ceil(getRemainingMuteMs(username) / 60000);
  }, [getRemainingMuteMs]);

  return { isUserMuted, muteUser, unmuteUser, getRemainingMuteMs, getRemainingMuteMinutes };
}
