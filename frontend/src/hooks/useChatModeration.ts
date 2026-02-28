import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { moderateMessage, getOpenAIKey } from '../lib/openai';
import { addModLogEntry } from '../lib/modLog';

const BOT_USERNAME = 'G.AI 🤖';
const BAN_KEY = 'globalchat_bans';
const DEFAULT_BAN_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function banUser(username: string, reason: string) {
  try {
    const raw = localStorage.getItem(BAN_KEY);
    const bans: Record<string, number> = raw ? JSON.parse(raw) : {};
    bans[username] = Date.now() + DEFAULT_BAN_DURATION_MS;
    localStorage.setItem(BAN_KEY, JSON.stringify(bans));
    // Broadcast so other tabs pick up the ban
    const ch = new BroadcastChannel('globalchat_server_control');
    ch.postMessage({ type: 'ban_update', username, reason });
    ch.close();
  } catch {
    // ignore
  }
}

export function useChatModeration(
  messages: ChatMessage[],
  sendMessage: (msg: ChatMessage) => void
) {
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Skip bot messages
    if (lastMessage.isBot) return;
    if (lastMessage.username === BOT_USERNAME) return;
    if (lastMessage.username.endsWith('🤖')) return;

    // Skip forced messages to prevent self-triggering bans
    if (lastMessage.isForced) return;

    // Skip big messages
    if (lastMessage.isBigMessage) return;

    // Skip already processed
    if (processedIds.current.has(lastMessage.id)) return;
    processedIds.current.add(lastMessage.id);

    // Only run if API key is configured
    if (!getOpenAIKey()) return;

    (async () => {
      try {
        const flagged = await moderateMessage(lastMessage.text);
        if (flagged) {
          banUser(lastMessage.username, 'Disrespectful message');
          addModLogEntry({
            username: lastMessage.username,
            message: lastMessage.text,
            timestamp: lastMessage.timestamp,
            reason: 'Disrespectful message detected by AI moderation',
          });
          const warnMsg: ChatMessage = {
            id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            username: BOT_USERNAME,
            text: '⚠️ A user has been removed from the chat for violating our community rules. Please keep the conversation respectful.',
            timestamp: Date.now(),
            isBot: true,
            isBigMessage: false,
            isForced: false,
            isSystem: false,
            isBroadcast: false,
          };
          sendMessage(warnMsg);
        }
      } catch {
        // Silently fail moderation errors
      }
    })();
  }, [messages, sendMessage]);
}
