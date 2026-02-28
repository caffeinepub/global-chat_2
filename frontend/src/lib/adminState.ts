// Version 9 admin state constants and helpers for v9 localStorage keys

const PINNED_KEY = "globalchat_pinned";
const HIGHLIGHTS_KEY = "globalchat_highlights";
const SHADOWBANS_KEY = "globalchat_shadowbans";
const SLOWMODE_KEY = "globalchat_slowmode";
const LOCKED_KEY = "globalchat_locked";
const MOTD_KEY = "globalchat_motd";
const THEME_KEY = "globalchat_theme";

export function getPinned(): string | null {
  try {
    return localStorage.getItem(PINNED_KEY);
  } catch {
    console.error("adminState: failed to read pinned");
    return null;
  }
}

export function setPinned(value: string): void {
  try {
    localStorage.setItem(PINNED_KEY, value);
  } catch {
    console.error("adminState: failed to set pinned");
  }
}

export function removePinned(): void {
  try {
    localStorage.removeItem(PINNED_KEY);
  } catch {
    console.error("adminState: failed to remove pinned");
  }
}

export function getHighlights(): Record<string, string> {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    console.error("adminState: failed to read highlights");
    return {};
  }
}

export function setHighlights(value: Record<string, string>): void {
  try {
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(value));
  } catch {
    console.error("adminState: failed to set highlights");
  }
}

export function getShadowbans(): string[] {
  try {
    const raw = localStorage.getItem(SHADOWBANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    console.error("adminState: failed to read shadowbans");
    return [];
  }
}

export function setShadowbans(value: string[]): void {
  try {
    localStorage.setItem(SHADOWBANS_KEY, JSON.stringify(value));
  } catch {
    console.error("adminState: failed to set shadowbans");
  }
}

export function getSlowmode(): number {
  try {
    const raw = localStorage.getItem(SLOWMODE_KEY);
    if (!raw) return 0;
    return parseInt(raw, 10) || 0;
  } catch {
    console.error("adminState: failed to read slowmode");
    return 0;
  }
}

export function setSlowmode(seconds: number): void {
  try {
    localStorage.setItem(SLOWMODE_KEY, String(seconds));
  } catch {
    console.error("adminState: failed to set slowmode");
  }
}

export function isLocked(): boolean {
  try {
    return localStorage.getItem(LOCKED_KEY) === "true";
  } catch {
    console.error("adminState: failed to read locked");
    return false;
  }
}

export function setLocked(value: boolean): void {
  try {
    localStorage.setItem(LOCKED_KEY, value ? "true" : "false");
  } catch {
    console.error("adminState: failed to set locked");
  }
}

export function getMOTD(): string | null {
  try {
    return localStorage.getItem(MOTD_KEY);
  } catch {
    console.error("adminState: failed to read MOTD");
    return null;
  }
}

export function setMOTD(value: string): void {
  try {
    localStorage.setItem(MOTD_KEY, value);
  } catch {
    console.error("adminState: failed to set MOTD");
  }
}

export function removeMOTD(): void {
  try {
    localStorage.removeItem(MOTD_KEY);
  } catch {
    console.error("adminState: failed to remove MOTD");
  }
}

export function getTheme(): string {
  try {
    return localStorage.getItem(THEME_KEY) || "dark";
  } catch {
    console.error("adminState: failed to read theme");
    return "dark";
  }
}

export function setTheme(value: string): void {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    console.error("adminState: failed to set theme");
  }
}
