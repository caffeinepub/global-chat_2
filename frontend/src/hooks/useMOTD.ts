import { useState, useEffect, useCallback } from 'react';

function readMOTD(): string | null {
  return localStorage.getItem('globalchat_motd');
}

export function useMOTD() {
  const [motdMessage, setMotdMessage] = useState<string | null>(readMOTD);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel('globalchat_server_control');
    channel.onmessage = (event) => {
      const { type, motd } = event.data || {};
      if (type === 'set_motd') {
        setMotdMessage(motd ?? null);
        setIsDismissed(false);
      } else if (type === 'clear_motd') {
        setMotdMessage(null);
        setIsDismissed(false);
      }
    };
    return () => channel.close();
  }, []);

  const dismissMOTD = useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    motdMessage: motdMessage && !isDismissed ? motdMessage : null,
    isDismissed,
    dismissMOTD,
  };
}
