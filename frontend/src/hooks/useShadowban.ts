import { useState, useEffect } from 'react';

function readShadowbans(): string[] {
  try {
    const raw = localStorage.getItem('globalchat_shadowbans');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useShadowban(username: string) {
  const [shadowbannedUsers, setShadowbannedUsers] = useState<string[]>(readShadowbans);

  useEffect(() => {
    const channel = new BroadcastChannel('globalchat_server_control');
    channel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'shadowban' || type === 'unshadowban') {
        setShadowbannedUsers(readShadowbans());
      }
    };
    return () => channel.close();
  }, []);

  const isShadowbanned = shadowbannedUsers.includes(username);

  return { isShadowbanned, shadowbannedUsers };
}
