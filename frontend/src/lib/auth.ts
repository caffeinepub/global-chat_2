// Authentication utility with all localStorage operations wrapped in try-catch
// Uses btoa() for password encoding — consistent across register, login, and seed.

export interface UserCredentials {
  username: string;
  passwordHash: string;
}

const STORAGE_KEY = "globalchat_users";
const SESSION_KEY = "globalchat_session";

function getUsers(): UserCredentials[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UserCredentials[];
  } catch {
    return [];
  }
}

function saveUsers(users: UserCredentials[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore storage errors
  }
}

function encodePassword(password: string): string {
  try {
    return btoa(password);
  } catch {
    // btoa can fail on non-latin1 chars; fall back to a safe encoding
    return btoa(encodeURIComponent(password));
  }
}

export function registerUser(
  username: string,
  password: string
): { success: boolean; error?: string } {
  try {
    if (!username || !username.trim()) {
      return { success: false, error: "Username is required." };
    }
    if (!password) {
      return { success: false, error: "Password is required." };
    }
    const users = getUsers();
    const exists = users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, error: "Username already taken." };
    }
    const newUser: UserCredentials = {
      username: username.trim(),
      passwordHash: encodePassword(password),
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true };
  } catch (e) {
    console.error("auth.ts: registerUser error", e);
    return { success: false, error: "Registration failed. Please try again." };
  }
}

export function loginUser(
  username: string,
  password: string
): { success: boolean; error?: string } {
  try {
    if (!username || !password) {
      return { success: false, error: "Invalid username or password." };
    }
    const users = getUsers();
    const encodedInput = encodePassword(password);
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.passwordHash === encodedInput
    );
    if (!user) {
      return { success: false, error: "Invalid username or password." };
    }
    return { success: true };
  } catch (e) {
    console.error("auth.ts: loginUser error", e);
    return { success: false, error: "Invalid username or password." };
  }
}

export function getSession(): { isAuthenticated: boolean; username?: string } {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { isAuthenticated: false };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.isAuthenticated === true && parsed.username) {
      return { isAuthenticated: true, username: parsed.username };
    }
    return { isAuthenticated: false };
  } catch {
    return { isAuthenticated: false };
  }
}

export function saveSession(username: string): void {
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ isAuthenticated: true, username })
    );
  } catch {
    // ignore storage errors
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

// Seed the AI.Caffeine owner account on module load.
// Password is "2580". Always ensures the stored hash matches btoa("2580").
function seedOwnerAccount(): void {
  try {
    const users = getUsers();
    const ownerUsername = "AI.Caffeine";
    const ownerHash = encodePassword("2580");
    const ownerIndex = users.findIndex(
      (u) => u.username === ownerUsername
    );
    if (ownerIndex === -1) {
      // Account doesn't exist yet — create it
      users.push({ username: ownerUsername, passwordHash: ownerHash });
      saveUsers(users);
    } else if (users[ownerIndex].passwordHash !== ownerHash) {
      // Account exists but has wrong hash (stale seed from old encoding) — fix it
      users[ownerIndex] = { username: ownerUsername, passwordHash: ownerHash };
      saveUsers(users);
    }
    // If hash already matches, nothing to do
  } catch (e) {
    console.error("auth.ts: seedOwnerAccount error", e);
  }
}

seedOwnerAccount();
