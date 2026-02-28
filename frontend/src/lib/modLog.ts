const MOD_LOG_KEY = 'globalchat_modlog';
const MAX_LOG_SIZE = 100;

export interface ModLogEntry {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  reason: string;
}

export function getModLog(): ModLogEntry[] {
  try {
    const raw = localStorage.getItem(MOD_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ModLogEntry[];
  } catch {
    return [];
  }
}

export function addModLogEntry(entry: Omit<ModLogEntry, 'id'>): void {
  const log = getModLog();
  const newEntry: ModLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  const updated = [newEntry, ...log].slice(0, MAX_LOG_SIZE);
  localStorage.setItem(MOD_LOG_KEY, JSON.stringify(updated));
}

export function clearModLog(): void {
  localStorage.removeItem(MOD_LOG_KEY);
}
