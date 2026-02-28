import { useCallback } from 'react';

const BAN_STORAGE_KEY = 'globalchat_bans';
const BAN_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface BanRecord {
  expiresAt: number;
  reason?: string;
}

interface BanMap {
  [username: string]: BanRecord;
}

function loadBans(): BanMap {
  try {
    const raw = localStorage.getItem(BAN_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BanMap;
  } catch {
    return {};
  }
}

function saveBans(bans: BanMap): void {
  localStorage.setItem(BAN_STORAGE_KEY, JSON.stringify(bans));
}

function pruneExpiredBans(bans: BanMap): BanMap {
  const now = Date.now();
  const pruned: BanMap = {};
  for (const [username, record] of Object.entries(bans)) {
    if (record.expiresAt > now) {
      pruned[username] = record;
    }
  }
  return pruned;
}

export function getActiveBans(): Array<{ username: string; expiresAt: number; reason?: string }> {
  const bans = pruneExpiredBans(loadBans());
  saveBans(bans);
  return Object.entries(bans).map(([username, record]) => ({
    username,
    expiresAt: record.expiresAt,
    reason: record.reason,
  }));
}

export function useBanManager() {
  const isUserBanned = useCallback((username: string): boolean => {
    const bans = pruneExpiredBans(loadBans());
    saveBans(bans);
    return !!bans[username] && bans[username].expiresAt > Date.now();
  }, []);

  const banUser = useCallback((username: string, reason?: string): void => {
    const bans = pruneExpiredBans(loadBans());
    bans[username] = { expiresAt: Date.now() + BAN_DURATION_MS, reason };
    saveBans(bans);
  }, []);

  const unbanUser = useCallback((username: string): void => {
    const bans = loadBans();
    delete bans[username];
    saveBans(bans);
  }, []);

  const getRemainingBanMs = useCallback((username: string): number => {
    const bans = loadBans();
    const record = bans[username];
    if (!record) return 0;
    const remaining = record.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }, []);

  const getRemainingBanMinutes = useCallback((username: string): number => {
    return Math.ceil(getRemainingBanMs(username) / 60000);
  }, [getRemainingBanMs]);

  return { isUserBanned, banUser, unbanUser, getRemainingBanMs, getRemainingBanMinutes };
}
