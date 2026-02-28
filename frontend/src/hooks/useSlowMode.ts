import { useState, useEffect, useCallback } from 'react';
import { getSlowMode } from '../lib/adminState';
import { subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

const TIMESTAMPS_KEY = 'globalchat_slowmode_timestamps';

function getLastSendTime(username: string): number {
  try {
    const raw = localStorage.getItem(TIMESTAMPS_KEY);
    if (!raw) return 0;
    const map = JSON.parse(raw) as Record<string, number>;
    return map[username] || 0;
  } catch { return 0; }
}

function setLastSendTime(username: string): void {
  try {
    const raw = localStorage.getItem(TIMESTAMPS_KEY);
    const map = raw ? JSON.parse(raw) as Record<string, number> : {};
    map[username] = Date.now();
    localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

export function useSlowMode(username: string) {
  const [slowMode, setSlowMode] = useState(() => getSlowMode());
  const [remainingCooldown, setRemainingCooldown] = useState(0);

  useEffect(() => {
    const handler = (event: { eventType: string }) => {
      if (event.eventType === 'slowmode') {
        setSlowMode(getSlowMode());
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!slowMode.enabled) { setRemainingCooldown(0); return; }
      const last = getLastSendTime(username);
      const elapsed = (Date.now() - last) / 1000;
      const remaining = Math.max(0, slowMode.cooldownSeconds - elapsed);
      setRemainingCooldown(Math.ceil(remaining));
    }, 500);
    return () => clearInterval(interval);
  }, [slowMode, username]);

  const recordSend = useCallback(() => {
    setLastSendTime(username);
  }, [username]);

  const canSend = !slowMode.enabled || remainingCooldown === 0;

  return {
    isSlowModeActive: slowMode.enabled,
    canSend,
    remainingCooldown,
    cooldownSeconds: slowMode.cooldownSeconds,
    recordSend,
  };
}
