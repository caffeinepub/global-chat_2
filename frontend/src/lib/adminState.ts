// Admin state management for various chat features

const CHANNEL_NAME = 'globalchat_server_control';

export interface PinnedMessage {
  messageId: string;
  pinnedAt: number;
}

export interface HighlightEntry {
  username: string;
  color: string;
  expiresAt: number;
}

export interface SlowModeState {
  enabled: boolean;
  cooldownSeconds: number;
}

// Broadcast helper
export function broadcastAdminEvent(eventType: string, payload?: unknown): void {
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ eventType, payload, timestamp: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel not available
  }
}

// Pinned messages
export function getPinnedMessage(): PinnedMessage | null {
  try {
    const raw = localStorage.getItem('globalchat_pinned');
    if (!raw) return null;
    return JSON.parse(raw) as PinnedMessage;
  } catch { return null; }
}

export function setPinnedMessage(messageId: string): void {
  const entry: PinnedMessage = { messageId, pinnedAt: Date.now() };
  localStorage.setItem('globalchat_pinned', JSON.stringify(entry));
  broadcastAdminEvent('pinned', entry);
}

export function clearPinnedMessage(): void {
  localStorage.removeItem('globalchat_pinned');
  broadcastAdminEvent('pinned', null);
}

// Theme
export function getAdminTheme(): string {
  return localStorage.getItem('globalchat_theme') || 'dark';
}

export function setAdminTheme(theme: string): void {
  localStorage.setItem('globalchat_theme', theme);
  broadcastAdminEvent('theme', theme);
}

// Slow mode
export function getSlowMode(): SlowModeState {
  try {
    const raw = localStorage.getItem('globalchat_slowmode');
    if (!raw) return { enabled: false, cooldownSeconds: 5 };
    return JSON.parse(raw) as SlowModeState;
  } catch { return { enabled: false, cooldownSeconds: 5 }; }
}

export function setSlowMode(enabled: boolean, cooldownSeconds: number): void {
  const state: SlowModeState = { enabled, cooldownSeconds };
  localStorage.setItem('globalchat_slowmode', JSON.stringify(state));
  broadcastAdminEvent('slowmode', state);
}

// Chat lock
export function getChatLocked(): boolean {
  return localStorage.getItem('globalchat_locked') === 'true';
}

export function setChatLocked(locked: boolean): void {
  localStorage.setItem('globalchat_locked', locked ? 'true' : 'false');
  broadcastAdminEvent('lock', locked);
}

// MOTD
export function getMOTD(): string {
  return localStorage.getItem('globalchat_motd') || '';
}

export function setMOTD(message: string): void {
  localStorage.setItem('globalchat_motd', message);
  // Clear dismissed state when new MOTD is set
  localStorage.removeItem('globalchat_motd_dismissed');
  broadcastAdminEvent('motd', message);
}

export function clearMOTD(): void {
  localStorage.removeItem('globalchat_motd');
  localStorage.removeItem('globalchat_motd_dismissed');
  broadcastAdminEvent('motd', '');
}

export function isMOTDDismissed(): boolean {
  return localStorage.getItem('globalchat_motd_dismissed') === 'true';
}

export function dismissMOTDLocally(): void {
  localStorage.setItem('globalchat_motd_dismissed', 'true');
}

// Highlights
export function getHighlights(): HighlightEntry[] {
  try {
    const raw = localStorage.getItem('globalchat_highlights');
    if (!raw) return [];
    const all = JSON.parse(raw) as HighlightEntry[];
    return all.filter(h => h.expiresAt > Date.now());
  } catch { return []; }
}

export function addHighlight(username: string, color: string, durationSeconds: number): void {
  const highlights = getHighlights();
  const filtered = highlights.filter(h => h.username !== username);
  filtered.push({ username, color, expiresAt: Date.now() + durationSeconds * 1000 });
  localStorage.setItem('globalchat_highlights', JSON.stringify(filtered));
  broadcastAdminEvent('highlights', filtered);
}

// Shadowban
export function getShadowbanned(): string[] {
  try {
    const raw = localStorage.getItem('globalchat_shadowbanned');
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch { return []; }
}

export function shadowbanUser(username: string): void {
  const list = getShadowbanned();
  if (!list.includes(username)) {
    list.push(username);
    localStorage.setItem('globalchat_shadowbanned', JSON.stringify(list));
    broadcastAdminEvent('shadowban', list);
  }
}

export function unshadowbanUser(username: string): void {
  const list = getShadowbanned().filter(u => u !== username);
  localStorage.setItem('globalchat_shadowbanned', JSON.stringify(list));
  broadcastAdminEvent('shadowban', list);
}

export function isUserShadowbanned(username: string): boolean {
  return getShadowbanned().includes(username);
}

// Channel name
export function getChannelName(): string {
  return localStorage.getItem('globalchat_channel_name') || 'global';
}

export function setChannelName(name: string): void {
  localStorage.setItem('globalchat_channel_name', name);
  broadcastAdminEvent('channelRename', name);
}

// User limit
export function getUserLimit(): number | null {
  const raw = localStorage.getItem('globalchat_user_limit');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export function setUserLimit(limit: number | null): void {
  if (limit === null) {
    localStorage.removeItem('globalchat_user_limit');
  } else {
    localStorage.setItem('globalchat_user_limit', String(limit));
  }
}

// Profanity filter
export function getProfanityFilter(): boolean {
  return localStorage.getItem('globalchat_profanity_filter') === 'true';
}

export function setProfanityFilter(enabled: boolean): void {
  localStorage.setItem('globalchat_profanity_filter', enabled ? 'true' : 'false');
  broadcastAdminEvent('profanityFilter', enabled);
}
