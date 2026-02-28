import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { moderateMessage, getOpenAIKey } from '../lib/openai';
import { useBanManager } from './useBanManager';
import { addModLogEntry } from '../lib/modLog';

const BOT_USERNAME = 'G.AI 🤖';

type SendMessageFn = (
  text: string,
  overrideUsername?: string,
  isBot?: boolean,
  extras?: Partial<Pick<ChatMessage, 'isBigMessage' | 'isForced'>>
) => ChatMessage;

export function useChatModeration(
  messages: ChatMessage[],
  sendMessage: SendMessageFn
) {
  const processedIds = useRef<Set<string>>(new Set());
  const { banUser } = useBanManager();

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
          sendMessage(
            '⚠️ A user has been removed from the chat for violating our community rules. Please keep the conversation respectful.',
            BOT_USERNAME,
            true
          );
        }
      } catch {
        // Silently fail moderation errors
      }
    })();
  }, [messages, sendMessage, banUser]);
}
