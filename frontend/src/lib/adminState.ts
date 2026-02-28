// Version 9 admin state - only v9 localStorage keys
// Retained keys: globalchat_pinned, globalchat_highlights, globalchat_shadowbans,
// globalchat_slowmode, globalchat_locked, globalchat_motd, globalchat_theme

export const ADMIN_STATE_KEYS = {
  PINNED: "globalchat_pinned",
  HIGHLIGHTS: "globalchat_highlights",
  SHADOWBANS: "globalchat_shadowbans",
  SLOWMODE: "globalchat_slowmode",
  LOCKED: "globalchat_locked",
  MOTD: "globalchat_motd",
  THEME: "globalchat_theme",
} as const;

export function getPinnedMessage() {
  try {
    const raw = localStorage.getItem(ADMIN_STATE_KEYS.PINNED);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getHighlights(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ADMIN_STATE_KEYS.HIGHLIGHTS);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function getShadowbans(): string[] {
  try {
    const raw = localStorage.getItem(ADMIN_STATE_KEYS.SHADOWBANS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getSlowMode(): { enabled: boolean; seconds: number } {
  try {
    const raw = localStorage.getItem(ADMIN_STATE_KEYS.SLOWMODE);
    return raw ? JSON.parse(raw) : { enabled: false, seconds: 0 };
  } catch { return { enabled: false, seconds: 0 }; }
}

export function isLocked(): boolean {
  return localStorage.getItem(ADMIN_STATE_KEYS.LOCKED) === "true";
}

export function getMOTD(): string | null {
  return localStorage.getItem(ADMIN_STATE_KEYS.MOTD);
}

export function getTheme(): string {
  return localStorage.getItem(ADMIN_STATE_KEYS.THEME) || "default";
}
