// Server state management via localStorage + BroadcastChannel

export interface ServerState {
  isShutdown: boolean;
  shutdownUntil: number | null;
  shutdownBy: string;
  shutdownMessage: string;
}

const SERVER_STATE_KEY = 'globalchat_server_state';
const MAX_SHUTDOWN_MINUTES = 50;

const defaultState: ServerState = {
  isShutdown: false,
  shutdownUntil: null,
  shutdownBy: '',
  shutdownMessage: '',
};

export function getServerState(): ServerState {
  try {
    const raw = localStorage.getItem(SERVER_STATE_KEY);
    if (!raw) return { ...defaultState };
    const state = JSON.parse(raw) as ServerState;
    // Auto-restore if timer expired
    if (state.isShutdown && state.shutdownUntil && Date.now() >= state.shutdownUntil) {
      const restored = { ...defaultState };
      localStorage.setItem(SERVER_STATE_KEY, JSON.stringify(restored));
      return restored;
    }
    return state;
  } catch {
    return { ...defaultState };
  }
}

export function setServerShutdown(durationMs: number, message: string, by: string): ServerState {
  const capped = Math.min(durationMs, MAX_SHUTDOWN_MINUTES * 60 * 1000);
  const state: ServerState = {
    isShutdown: true,
    shutdownUntil: Date.now() + capped,
    shutdownBy: by,
    shutdownMessage: message,
  };
  localStorage.setItem(SERVER_STATE_KEY, JSON.stringify(state));
  return state;
}

export function setServerStartup(): ServerState {
  const state: ServerState = { ...defaultState };
  localStorage.setItem(SERVER_STATE_KEY, JSON.stringify(state));
  return state;
}

export function isServerShutdown(): boolean {
  return getServerState().isShutdown;
}

export function getRemainingShutdownMs(): number {
  const state = getServerState();
  if (!state.isShutdown || !state.shutdownUntil) return 0;
  const remaining = state.shutdownUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function parseDurationInput(input: string): number | null {
  // Accepts mm:ss format
  const parts = input.trim().split(':');
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  if (seconds < 0 || seconds >= 60) return null;
  if (minutes < 0) return null;
  return (minutes * 60 + seconds) * 1000;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
