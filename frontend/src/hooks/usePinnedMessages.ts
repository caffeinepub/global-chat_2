import { useState, useEffect } from 'react';
import { getPinnedMessage, PinnedMessage } from '../lib/adminState';
import { subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

export function usePinnedMessages() {
  const [pinned, setPinned] = useState<PinnedMessage | null>(() => getPinnedMessage());

  useEffect(() => {
    const handler = (event: { eventType: string }) => {
      if (event.eventType === 'pinned') {
        setPinned(getPinnedMessage());
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, []);

  return { pinnedMessageId: pinned?.messageId ?? null };
}
