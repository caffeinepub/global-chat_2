import { useState, useEffect, useCallback } from "react";

function readLocked(): boolean {
  try {
    return localStorage.getItem("globalchat_locked") === "true";
  } catch {
    return false;
  }
}

export function useChatLock() {
  const [isLocked, setIsLocked] = useState<boolean>(readLocked);

  useEffect(() => {
    const channel = new BroadcastChannel("globalchat_server_control");
    channel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === "lock_chat") {
        setIsLocked(true);
      } else if (type === "unlock_chat") {
        setIsLocked(false);
      }
    };
    return () => channel.close();
  }, []);

  const isChatLocked = useCallback((username: string): boolean => {
    if (username === "AI.Caffeine") return false;
    return isLocked;
  }, [isLocked]);

  return { isLocked, isChatLocked };
}
