import { useCallback } from 'react';
import {
  setPinnedMessage,
  clearPinnedMessage,
  setAdminTheme,
  setSlowMode,
  setChatLocked,
  setMOTD,
  clearMOTD,
  addHighlight,
  shadowbanUser,
  unshadowbanUser,
  setChannelName,
  setUserLimit,
  setProfanityFilter,
  getProfanityFilter,
  broadcastAdminEvent,
} from '../lib/adminState';
import { exportChatLog } from '../lib/exportChatLog';
import { useBanManager } from './useBanManager';
import { useMuteManager } from './useMuteManager';

const STORAGE_KEY = 'globalchat_messages';

export function useAdminCommands(
  onSendMessage: (text: string, overrideUsername?: string, isBot?: boolean, extras?: Record<string, unknown>) => void
) {
  const { banUser, unbanUser } = useBanManager();
  const { muteUser, unmuteUser } = useMuteManager();

  // 1. Rename User (local display rename via localStorage)
  const renameUser = useCallback((oldName: string, newName: string): string => {
    if (!oldName.trim() || !newName.trim()) return 'Enter both usernames.';
    if (oldName === 'AI.Caffeine') return 'Cannot rename the owner.';
    try {
      const raw = localStorage.getItem('globalchat_users');
      const users = raw ? JSON.parse(raw) : {};
      const key = oldName.toLowerCase();
      if (!users[key]) return `User "${oldName}" not found.`;
      users[key].username = newName.trim();
      localStorage.setItem('globalchat_users', JSON.stringify(users));
      broadcastAdminEvent('userRenamed', { oldName, newName });
      return `✓ Renamed "${oldName}" to "${newName}".`;
    } catch { return 'Failed to rename user.'; }
  }, []);

  // 2. Clear All Chat
  const clearAllChat = useCallback((): string => {
    localStorage.removeItem(STORAGE_KEY);
    broadcastAdminEvent('clearChat', null);
    return '✓ All chat messages cleared.';
  }, []);

  // 3. Pin Message
  const pinMessage = useCallback((messageId: string): string => {
    if (!messageId.trim()) return 'Enter a message ID.';
    setPinnedMessage(messageId.trim());
    return `✓ Message pinned.`;
  }, []);

  // 4. Unpin Message
  const unpinMessage = useCallback((): string => {
    clearPinnedMessage();
    return '✓ Message unpinned.';
  }, []);

  // 5. Announce Role
  const announceRole = useCallback((username: string, role: string): string => {
    if (!username.trim() || !role.trim()) return 'Enter username and role.';
    onSendMessage(`🎖️ ${username} has been given the role: ${role}`, 'G.AI 🤖', true);
    return `✓ Role "${role}" announced for ${username}.`;
  }, [onSendMessage]);

  // 6. Change Theme
  const changeTheme = useCallback((theme: string): string => {
    setAdminTheme(theme);
    return `✓ Theme changed to "${theme}".`;
  }, []);

  // 7. Set Slow Mode
  const enableSlowMode = useCallback((cooldownSeconds: number): string => {
    if (cooldownSeconds < 1) return 'Cooldown must be at least 1 second.';
    setSlowMode(true, cooldownSeconds);
    onSendMessage(`🐢 Slow mode enabled — ${cooldownSeconds}s cooldown between messages.`, 'G.AI 🤖', true);
    return `✓ Slow mode enabled (${cooldownSeconds}s cooldown).`;
  }, [onSendMessage]);

  // 8. Disable Slow Mode
  const disableSlowMode = useCallback((): string => {
    setSlowMode(false, 5);
    onSendMessage('⚡ Slow mode disabled.', 'G.AI 🤖', true);
    return '✓ Slow mode disabled.';
  }, [onSendMessage]);

  // 9. Lock Chat
  const lockChat = useCallback((): string => {
    setChatLocked(true);
    onSendMessage('🔒 Chat has been locked by an admin. Only admins can send messages.', 'G.AI 🤖', true);
    return '✓ Chat locked.';
  }, [onSendMessage]);

  // 10. Unlock Chat
  const unlockChat = useCallback((): string => {
    setChatLocked(false);
    onSendMessage('🔓 Chat has been unlocked. Everyone can send messages again.', 'G.AI 🤖', true);
    return '✓ Chat unlocked.';
  }, [onSendMessage]);

  // 11. Mass Mute
  const massMute = useCallback((durationMinutes: number): string => {
    if (durationMinutes < 1) return 'Duration must be at least 1 minute.';
    try {
      const raw = localStorage.getItem('globalchat_users');
      const users = raw ? JSON.parse(raw) : {};
      Object.values(users).forEach((u: unknown) => {
        const user = u as { username: string };
        if (user.username !== 'AI.Caffeine') {
          muteUser(user.username, durationMinutes * 60 * 1000, 'Mass mute by admin');
        }
      });
      onSendMessage(`🔇 All users have been muted for ${durationMinutes} minute(s).`, 'G.AI 🤖', true);
      return `✓ All users muted for ${durationMinutes} minute(s).`;
    } catch { return 'Failed to mass mute.'; }
  }, [muteUser, onSendMessage]);

  // 12. Mass Unmute
  const massUnmute = useCallback((): string => {
    try {
      localStorage.removeItem('globalchat_mutes');
      onSendMessage('🔊 All users have been unmuted.', 'G.AI 🤖', true);
      return '✓ All users unmuted.';
    } catch { return 'Failed to mass unmute.'; }
  }, [onSendMessage]);

  // 13. Fake Join
  const fakeJoin = useCallback((username: string): string => {
    if (!username.trim()) return 'Enter a username.';
    onSendMessage(`👋 ${username} joined the server!`, 'G.AI 🤖', true);
    broadcastAdminEvent('fakeJoin', username);
    return `✓ Fake join sent for "${username}".`;
  }, [onSendMessage]);

  // 14. Fake Leave
  const fakeLeave = useCallback((username: string): string => {
    if (!username.trim()) return 'Enter a username.';
    onSendMessage(`👋 ${username} left the server.`, 'G.AI 🤖', true);
    broadcastAdminEvent('fakeLeave', username);
    return `✓ Fake leave sent for "${username}".`;
  }, [onSendMessage]);

  // 15. Set MOTD
  const setMOTDCommand = useCallback((message: string): string => {
    if (!message.trim()) return 'Enter a message.';
    setMOTD(message.trim());
    return '✓ Message of the Day set.';
  }, []);

  // 16. Clear MOTD
  const clearMOTDCommand = useCallback((): string => {
    clearMOTD();
    return '✓ MOTD cleared.';
  }, []);

  // 17. Highlight User
  const highlightUser = useCallback((username: string, color: string, durationSeconds: number): string => {
    if (!username.trim()) return 'Enter a username.';
    if (!color.trim()) return 'Enter a color.';
    if (durationSeconds < 1) return 'Duration must be at least 1 second.';
    addHighlight(username.trim(), color.trim(), durationSeconds);
    return `✓ ${username} highlighted in ${color} for ${durationSeconds}s.`;
  }, []);

  // 18. Shadowban
  const shadowban = useCallback((username: string): string => {
    if (!username.trim()) return 'Enter a username.';
    if (username === 'AI.Caffeine') return 'Cannot shadowban the owner.';
    shadowbanUser(username.trim());
    return `✓ ${username} has been shadowbanned.`;
  }, []);

  // 19. Unshadowban
  const unshadowban = useCallback((username: string): string => {
    if (!username.trim()) return 'Enter a username.';
    unshadowbanUser(username.trim());
    return `✓ ${username} has been unshadowbanned.`;
  }, []);

  // 20. Rename Channel
  const renameChannel = useCallback((newName: string): string => {
    if (!newName.trim()) return 'Enter a channel name.';
    setChannelName(newName.trim());
    return `✓ Channel renamed to "#${newName}".`;
  }, []);

  // 21. Set User Limit
  const setUserLimitCommand = useCallback((limit: number): string => {
    if (limit < 1) return 'Limit must be at least 1.';
    setUserLimit(limit);
    return `✓ User limit set to ${limit}.`;
  }, []);

  // 22. Reset User Limit
  const resetUserLimit = useCallback((): string => {
    setUserLimit(null);
    return '✓ User limit removed.';
  }, []);

  // 23. Toggle Profanity Filter
  const toggleProfanityFilter = useCallback((): string => {
    const current = getProfanityFilter();
    setProfanityFilter(!current);
    return `✓ Profanity filter ${!current ? 'enabled' : 'disabled'}.`;
  }, []);

  // 24. Impersonate Bot
  const impersonateBot = useCallback((message: string): string => {
    if (!message.trim()) return 'Enter a message.';
    onSendMessage(message.trim(), 'G.AI 🤖', true);
    return '✓ Bot message sent.';
  }, [onSendMessage]);

  // 25. Export Chat Log
  const exportLog = useCallback((): string => {
    exportChatLog();
    return '✓ Chat log download started.';
  }, []);

  // Extra: Mass Ban
  const massBan = useCallback((durationMinutes: number): string => {
    if (durationMinutes < 1) return 'Duration must be at least 1 minute.';
    try {
      const raw = localStorage.getItem('globalchat_users');
      const users = raw ? JSON.parse(raw) : {};
      Object.values(users).forEach((u: unknown) => {
        const user = u as { username: string };
        if (user.username !== 'AI.Caffeine') {
          banUser(user.username, 'Mass ban by admin');
        }
      });
      onSendMessage(`🔨 All users have been banned for ${durationMinutes} minute(s).`, 'G.AI 🤖', true);
      return `✓ All users banned.`;
    } catch { return 'Failed to mass ban.'; }
  }, [banUser, onSendMessage]);

  // Extra: Mass Unban
  const massUnban = useCallback((): string => {
    localStorage.removeItem('globalchat_bans');
    onSendMessage('✅ All bans have been lifted.', 'G.AI 🤖', true);
    return '✓ All users unbanned.';
  }, [onSendMessage]);

  return {
    renameUser,
    clearAllChat,
    pinMessage,
    unpinMessage,
    announceRole,
    changeTheme,
    enableSlowMode,
    disableSlowMode,
    lockChat,
    unlockChat,
    massMute,
    massUnmute,
    fakeJoin,
    fakeLeave,
    setMOTDCommand,
    clearMOTDCommand,
    highlightUser,
    shadowban,
    unshadowban,
    renameChannel,
    setUserLimitCommand,
    resetUserLimit,
    toggleProfanityFilter,
    impersonateBot,
    exportLog,
    massBan,
    massUnban,
    banUser,
    unbanUser,
  };
}
