import { useState, useEffect } from 'react';
import { getShadowbanned } from '../lib/adminState';
import { subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

export function useShadowban(username: string) {
  const [shadowbannedUsers, setShadowbannedUsers] = useState<string[]>(() => getShadowbanned());

  useEffect(() => {
    const handler = (event: { eventType: string }) => {
      if (event.eventType === 'shadowban') {
        setShadowbannedUsers(getShadowbanned());
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, []);

  const isShadowbanned = shadowbannedUsers.includes(username);

  return { isShadowbanned, shadowbannedUsers };
}
