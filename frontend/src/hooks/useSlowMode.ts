import { useState, useEffect, useCallback, useRef } from "react";

interface SlowModeState {
  enabled: boolean;
  seconds: number;
}

function readSlowMode(): SlowModeState {
  try {
    const raw = localStorage.getItem("globalchat_slowmode");
    if (!raw) return { enabled: false, seconds: 0 };
    return JSON.parse(raw) as SlowModeState;
  } catch {
    return { enabled: false, seconds: 0 };
  }
}

export function useSlowMode() {
  const [slowMode, setSlowMode] = useState<SlowModeState>(readSlowMode);
  const lastMessageTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    const channel = new BroadcastChannel("globalchat_server_control");
    channel.onmessage = (event) => {
      const { type, enabled, seconds } = event.data || {};
      if (type === "slowmode") {
        const newState = { enabled: Boolean(enabled), seconds: Number(seconds) || 0 };
        setSlowMode(newState);
      }
    };
    return () => channel.close();
  }, []);

  const isInCooldown = useCallback((username: string): boolean => {
    if (!slowMode.enabled || slowMode.seconds <= 0) return false;
    const last = lastMessageTimes.current[username] || 0;
    return Date.now() - last < slowMode.seconds * 1000;
  }, [slowMode]);

  const getRemainingCooldownSeconds = useCallback((username: string): number => {
    if (!slowMode.enabled || slowMode.seconds <= 0) return 0;
    const last = lastMessageTimes.current[username] || 0;
    const elapsed = (Date.now() - last) / 1000;
    return Math.max(0, Math.ceil(slowMode.seconds - elapsed));
  }, [slowMode]);

  const recordMessageSent = useCallback((username: string) => {
    lastMessageTimes.current[username] = Date.now();
  }, []);

  return {
    slowMode,
    isInCooldown,
    getRemainingCooldownSeconds,
    recordMessageSent,
  };
}
