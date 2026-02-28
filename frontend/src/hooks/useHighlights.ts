import { useState, useEffect, useCallback } from 'react';
import { getHighlights, HighlightEntry } from '../lib/adminState';
import { subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

export function useHighlights() {
  const [activeHighlights, setActiveHighlights] = useState<HighlightEntry[]>(() => getHighlights());

  useEffect(() => {
    const handler = (event: { eventType: string }) => {
      if (event.eventType === 'highlights') {
        setActiveHighlights(getHighlights());
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, []);

  // Prune expired highlights every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHighlights(getHighlights());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const isUserHighlighted = useCallback((username: string): string | null => {
    const entry = activeHighlights.find(h => h.username === username && h.expiresAt > Date.now());
    return entry ? entry.color : null;
  }, [activeHighlights]);

  return { activeHighlights, isUserHighlighted };
}
