const USERS_KEY = 'globalchat_users';
const SESSION_KEY = 'globalchat_session';

interface StoredUser {
  username: string;
  passwordHash: string;
}

interface Session {
  username: string;
  isAuthenticated: boolean;
}

// Simple encoding — not cryptographic, just obfuscation for localStorage
function encodePassword(password: string): string {
  return btoa(encodeURIComponent(password));
}

function verifyPassword(input: string, stored: string): boolean {
  return encodePassword(input) === stored;
}

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Seed the AI.Caffeine owner account with password '2580' if it doesn't already exist
function seedAICaffeineAccount(): void {
  const users = loadUsers();
  const key = 'ai.caffeine';
  if (!users[key]) {
    users[key] = {
      username: 'AI.Caffeine',
      passwordHash: encodePassword('2580'),
    };
    saveUsers(users);
  }
}

// Run seed on module load so the account is always available
seedAICaffeineAccount();

export function createAccount(username: string, password: string): { success: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) return { success: false, error: 'Username is required.' };
  if (trimmed.length > 32) return { success: false, error: 'Username must be 32 characters or less.' };
  if (password.length < 4) return { success: false, error: 'Password must be at least 4 characters.' };

  const users = loadUsers();
  if (users[trimmed.toLowerCase()]) {
    return { success: false, error: 'That username is already taken.' };
  }

  users[trimmed.toLowerCase()] = {
    username: trimmed,
    passwordHash: encodePassword(password),
  };
  saveUsers(users);
  return { success: true };
}

export function loginUser(username: string, password: string): { success: boolean; error?: string; resolvedUsername?: string } {
  const trimmed = username.trim();
  if (!trimmed) return { success: false, error: 'Username is required.' };
  if (!password) return { success: false, error: 'Password is required.' };

  const users = loadUsers();
  const record = users[trimmed.toLowerCase()];
  if (!record) {
    return { success: false, error: 'No account found with that username.' };
  }
  if (!verifyPassword(password, record.passwordHash)) {
    return { success: false, error: 'Incorrect password.' };
  }

  return { success: true, resolvedUsername: record.username };
}

export function setActiveSession(username: string): void {
  const session: Session = { username, isAuthenticated: true };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getActiveSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.isAuthenticated || !session.username) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
