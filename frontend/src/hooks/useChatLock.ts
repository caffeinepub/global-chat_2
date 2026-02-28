import { useState, useEffect } from 'react';
import { getChatLocked } from '../lib/adminState';
import { subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

export function useChatLock() {
  const [isChatLocked, setIsChatLocked] = useState(() => getChatLocked());

  useEffect(() => {
    const handler = (event: { eventType: string }) => {
      if (event.eventType === 'lock') {
        setIsChatLocked(getChatLocked());
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, []);

  return { isChatLocked };
}
