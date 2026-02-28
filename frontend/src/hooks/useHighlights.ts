import { useState, useEffect, useCallback } from 'react';

function readHighlights(): Record<string, string> {
  try {
    const raw = localStorage.getItem('globalchat_highlights');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useHighlights() {
  const [highlights, setHighlights] = useState<Record<string, string>>(readHighlights);

  useEffect(() => {
    const channel = new BroadcastChannel('globalchat_server_control');
    channel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'highlight_user') {
        setHighlights(readHighlights());
      }
    };
    return () => channel.close();
  }, []);

  const isUserHighlighted = useCallback((username: string): string | null => {
    return highlights[username] ?? null;
  }, [highlights]);

  return { highlights, isUserHighlighted };
}
