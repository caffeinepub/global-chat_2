import { useState, useEffect } from 'react';

interface PinnedMessage {
  id: string;
  username: string;
  text: string;
}

function readPinned(): PinnedMessage | null {
  try {
    const raw = localStorage.getItem('globalchat_pinned');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function usePinnedMessages() {
  const [pinned, setPinned] = useState<PinnedMessage | null>(readPinned);

  useEffect(() => {
    const channel = new BroadcastChannel('globalchat_server_control');
    channel.onmessage = (event) => {
      const { type, id, username, text } = event.data || {};
      if (type === 'pin_message') {
        const msg: PinnedMessage = { id, username, text };
        setPinned(msg);
        localStorage.setItem('globalchat_pinned', JSON.stringify(msg));
      } else if (type === 'unpin_message') {
        setPinned(null);
        localStorage.removeItem('globalchat_pinned');
      }
    };
    return () => channel.close();
  }, []);

  return { pinned, setPinned };
}
