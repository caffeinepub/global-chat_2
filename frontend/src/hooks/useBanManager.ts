import { useCallback } from "react";

interface BanEntry {
  username: string;
  bannedUntil: number;
  reason?: string;
}

function readBans(): BanEntry[] {
  try {
    const raw = localStorage.getItem("globalchat_bans");
    if (!raw) return [];
    return JSON.parse(raw) as BanEntry[];
  } catch {
    return [];
  }
}

function writeBans(bans: BanEntry[]) {
  localStorage.setItem("globalchat_bans", JSON.stringify(bans));
}

function pruneExpired(bans: BanEntry[]): BanEntry[] {
  const now = Date.now();
  return bans.filter(b => b.bannedUntil > now);
}

export function getActiveBans(): BanEntry[] {
  return pruneExpired(readBans());
}

export function useBanManager() {
  const banUser = useCallback((username: string, durationMinutes = 10, reason?: string) => {
    const bans = readBans();
    const filtered = bans.filter(b => b.username !== username);
    filtered.push({
      username,
      bannedUntil: Date.now() + durationMinutes * 60 * 1000,
      reason,
    });
    writeBans(filtered);
  }, []);

  const unbanUser = useCallback((username: string) => {
    const bans = readBans();
    writeBans(bans.filter(b => b.username !== username));
  }, []);

  const isUserBanned = useCallback((username: string): boolean => {
    const bans = readBans();
    const entry = bans.find(b => b.username === username);
    if (!entry) return false;
    if (Date.now() >= entry.bannedUntil) {
      writeBans(bans.filter(b => b.username !== username));
      return false;
    }
    return true;
  }, []);

  const getRemainingBanMs = useCallback((username: string): number => {
    const bans = readBans();
    const entry = bans.find(b => b.username === username);
    if (!entry) return 0;
    return Math.max(0, entry.bannedUntil - Date.now());
  }, []);

  const getRemainingBanMinutes = useCallback((username: string): number => {
    return Math.ceil(getRemainingBanMs(username) / 60000);
  }, [getRemainingBanMs]);

  return {
    banUser,
    unbanUser,
    isUserBanned,
    getRemainingBanMs,
    getRemainingBanMinutes,
  };
}
