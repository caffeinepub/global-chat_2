import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getServerState,
  setServerShutdown,
  setServerStartup,
  getRemainingShutdownMs,
  ServerState,
} from '../lib/serverState';
import { broadcastEvent, subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

export function useServerState() {
  const [state, setState] = useState<ServerState>(() => getServerState());
  const [remainingMs, setRemainingMs] = useState<number>(() => getRemainingShutdownMs());
  const [showStartupOverlay, setShowStartupOverlay] = useState(false);
  const startupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerStartupOverlay = useCallback(() => {
    setShowStartupOverlay(true);
    if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    startupTimerRef.current = setTimeout(() => {
      setShowStartupOverlay(false);
    }, 5000);
  }, []);

  // Listen for broadcast events from other tabs
  useEffect(() => {
    const handler = (event: { eventType: string; payload: unknown }) => {
      if (event.eventType === 'shutdown') {
        const fresh = getServerState();
        setState(fresh);
        setRemainingMs(getRemainingShutdownMs());
        setShowStartupOverlay(false);
      } else if (event.eventType === 'startup') {
        const fresh = getServerState();
        setState(fresh);
        setRemainingMs(0);
        triggerStartupOverlay();
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, [triggerStartupOverlay]);

  // Countdown timer — also detects natural expiry and triggers startup overlay
  useEffect(() => {
    if (!state.isShutdown) {
      setRemainingMs(0);
      return;
    }
    const interval = setInterval(() => {
      const ms = getRemainingShutdownMs();
      setRemainingMs(ms);
      if (ms <= 0) {
        // Timer expired naturally — transition to startup
        const fresh = getServerState();
        const wasShutdown = state.isShutdown;
        setState(fresh);
        if (wasShutdown && !fresh.isShutdown) {
          triggerStartupOverlay();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isShutdown, triggerStartupOverlay]);

  // Cleanup startup timer on unmount
  useEffect(() => {
    return () => {
      if (startupTimerRef.current) clearTimeout(startupTimerRef.current);
    };
  }, []);

  const shutdown = useCallback((durationMs: number, message: string, by: string) => {
    const newState = setServerShutdown(durationMs, message, by);
    setState(newState);
    setRemainingMs(getRemainingShutdownMs());
    setShowStartupOverlay(false);
    broadcastEvent('shutdown', newState);
  }, []);

  const startup = useCallback(() => {
    const newState = setServerStartup();
    setState(newState);
    setRemainingMs(0);
    broadcastEvent('startup', newState);
    // The admin (AI.Caffeine) who clicks startup does NOT see the overlay
    // Non-owner tabs receive the broadcast and trigger their own overlay
  }, []);

  return {
    isShutdown: state.isShutdown,
    shutdownMessage: state.shutdownMessage,
    shutdownBy: state.shutdownBy,
    shutdownUntil: state.shutdownUntil,
    remainingMs,
    showStartupOverlay,
    shutdown,
    startup,
  };
}
