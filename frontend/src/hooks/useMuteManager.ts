import { useState, useEffect, useCallback } from "react";

interface MuteEntry {
  username: string;
  mutedUntil: number;
}

function readMutes(): MuteEntry[] {
  try {
    const raw = localStorage.getItem("globalchat_mutes");
    if (!raw) return [];
    return JSON.parse(raw) as MuteEntry[];
  } catch {
    return [];
  }
}

function writeMutes(mutes: MuteEntry[]) {
  localStorage.setItem("globalchat_mutes", JSON.stringify(mutes));
}

function pruneExpired(mutes: MuteEntry[]): MuteEntry[] {
  const now = Date.now();
  return mutes.filter(m => m.mutedUntil > now);
}

export function useMuteManager() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Prune on mount
    const mutes = readMutes();
    const pruned = pruneExpired(mutes);
    if (pruned.length !== mutes.length) {
      writeMutes(pruned);
    }

    const channel = new BroadcastChannel("globalchat_server_control");
    channel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === "mute" || type === "unmute") {
        forceUpdate(n => n + 1);
      }
    };

    // Prune expired every 30 seconds
    const interval = setInterval(() => {
      const current = readMutes();
      const pruned = pruneExpired(current);
      if (pruned.length !== current.length) {
        writeMutes(pruned);
        forceUpdate(n => n + 1);
      }
    }, 30000);

    return () => {
      channel.close();
      clearInterval(interval);
    };
  }, []);

  const muteUser = useCallback((username: string, durationMinutes = 10) => {
    const mutes = readMutes();
    const filtered = mutes.filter(m => m.username !== username);
    filtered.push({ username, mutedUntil: Date.now() + durationMinutes * 60 * 1000 });
    writeMutes(filtered);
    forceUpdate(n => n + 1);
  }, []);

  const unmuteUser = useCallback((username: string) => {
    const mutes = readMutes();
    writeMutes(mutes.filter(m => m.username !== username));
    forceUpdate(n => n + 1);
  }, []);

  const isUserMuted = useCallback((username: string): boolean => {
    const mutes = readMutes();
    const entry = mutes.find(m => m.username === username);
    if (!entry) return false;
    if (Date.now() >= entry.mutedUntil) {
      // Prune this expired entry
      writeMutes(mutes.filter(m => m.username !== username));
      return false;
    }
    return true;
  }, []);

  const getRemainingMuteMs = useCallback((username: string): number => {
    const mutes = readMutes();
    const entry = mutes.find(m => m.username === username);
    if (!entry) return 0;
    return Math.max(0, entry.mutedUntil - Date.now());
  }, []);

  const getRemainingMuteMinutes = useCallback((username: string): number => {
    return Math.ceil(getRemainingMuteMs(username) / 60000);
  }, [getRemainingMuteMs]);

  return {
    muteUser,
    unmuteUser,
    isUserMuted,
    getRemainingMuteMs,
    getRemainingMuteMinutes,
  };
}
