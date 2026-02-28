import { useState, useEffect, useCallback } from 'react';
import { getMOTD, isMOTDDismissed, dismissMOTDLocally } from '../lib/adminState';
import { subscribeToBroadcast, unsubscribeFromBroadcast } from '../lib/broadcastControl';

export function useMOTD() {
  const [motdMessage, setMotdMessage] = useState<string>(() => getMOTD());
  const [isDismissed, setIsDismissed] = useState<boolean>(() => isMOTDDismissed());

  useEffect(() => {
    const handler = (event: { eventType: string }) => {
      if (event.eventType === 'motd') {
        setMotdMessage(getMOTD());
        setIsDismissed(isMOTDDismissed());
      }
    };
    subscribeToBroadcast(handler);
    return () => unsubscribeFromBroadcast(handler);
  }, []);

  const dismissMOTD = useCallback(() => {
    dismissMOTDLocally();
    setIsDismissed(true);
  }, []);

  return {
    motdMessage: motdMessage && !isDismissed ? motdMessage : null,
    isDismissed,
    dismissMOTD,
  };
}
