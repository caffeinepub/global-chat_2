import { useState, useEffect, useRef } from "react";

interface ServerState {
  isShutdown: boolean;
  shutdownUntil: number;
  shutdownMessage: string;
}

interface UseServerStateReturn {
  isShutdown: boolean;
  shutdownMessage: string;
  shutdownUntil: number;
  showStartupOverlay: boolean;
}

const DEFAULT_STATE: ServerState = {
  isShutdown: false,
  shutdownUntil: 0,
  shutdownMessage: "",
};

function readServerState(): ServerState {
  try {
    const raw = localStorage.getItem("globalchat_server_state");
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      isShutdown: Boolean(parsed.isShutdown),
      shutdownUntil: Number(parsed.shutdownUntil) || 0,
      shutdownMessage: String(parsed.shutdownMessage || ""),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useServerState(): UseServerStateReturn {
  const [state, setState] = useState<ServerState>(() => {
    const s = readServerState();
    // If shutdown but already expired, treat as running
    if (s.isShutdown && s.shutdownUntil > 0 && Date.now() >= s.shutdownUntil) {
      return DEFAULT_STATE;
    }
    return s;
  });
  const [showStartupOverlay, setShowStartupOverlay] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleAutoStartup = (shutdownUntil: number) => {
    clearTimer();
    const remaining = shutdownUntil - Date.now();
    if (remaining <= 0) return;
    timerRef.current = setTimeout(() => {
      const newState = { isShutdown: false, shutdownUntil: 0, shutdownMessage: "" };
      localStorage.setItem("globalchat_server_state", JSON.stringify(newState));
      setState(newState);
      setShowStartupOverlay(true);
      // Broadcast startup event
      try {
        const ch = new BroadcastChannel("globalchat_server_control");
        ch.postMessage({ type: "startup" });
        ch.close();
      } catch {}
      setTimeout(() => setShowStartupOverlay(false), 5000);
    }, remaining);
  };

  useEffect(() => {
    const s = readServerState();
    if (s.isShutdown && s.shutdownUntil > 0 && Date.now() < s.shutdownUntil) {
      setState(s);
      scheduleAutoStartup(s.shutdownUntil);
    } else if (s.isShutdown) {
      // Expired shutdown — clear it
      const cleared = DEFAULT_STATE;
      localStorage.setItem("globalchat_server_state", JSON.stringify(cleared));
      setState(cleared);
    }

    const channel = new BroadcastChannel("globalchat_server_control");
    channel.onmessage = (event) => {
      const { type, shutdownUntil, shutdownMessage } = event.data || {};
      if (type === "shutdown") {
        const newState: ServerState = {
          isShutdown: true,
          shutdownUntil: Number(shutdownUntil) || 0,
          shutdownMessage: String(shutdownMessage || "The server is temporarily offline."),
        };
        setState(newState);
        if (newState.shutdownUntil > 0) {
          scheduleAutoStartup(newState.shutdownUntil);
        }
      } else if (type === "startup") {
        clearTimer();
        setState(DEFAULT_STATE);
        setShowStartupOverlay(true);
        setTimeout(() => setShowStartupOverlay(false), 5000);
      }
    };

    return () => {
      clearTimer();
      channel.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isShutdown: state.isShutdown,
    shutdownMessage: state.shutdownMessage,
    shutdownUntil: state.shutdownUntil,
    showStartupOverlay,
  };
}
