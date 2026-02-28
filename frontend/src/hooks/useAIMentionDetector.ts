import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { chatCompletion, getOpenAIKey } from '../lib/openai';

const MENTION_PATTERN = /@G\.ai\s+(.+)/i;
const BOT_USERNAME = 'G.AI 🤖';

export function useAIMentionDetector(
  messages: ChatMessage[],
  sendMessage: (msg: ChatMessage) => void
) {
  const processedIds = useRef<Set<string>>(new Set());
  const isProcessing = useRef(false);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;
    if (lastMessage.isBot) return;
    if (processedIds.current.has(lastMessage.id)) return;

    const match = lastMessage.text.match(MENTION_PATTERN);
    if (!match) return;

    const question = match[1].trim();
    if (!question) return;

    processedIds.current.add(lastMessage.id);

    if (isProcessing.current) return;
    isProcessing.current = true;

    const apiKey = getOpenAIKey();
    if (!apiKey) {
      isProcessing.current = false;
      return;
    }

    (async () => {
      try {
        const response = await chatCompletion(
          [
            {
              role: 'system',
              content:
                'You are G.AI, a helpful and friendly assistant in a global chat room. Keep responses concise and conversational.',
            },
            { role: 'user', content: question },
          ],
          apiKey
        );

        const text = response || 'I could not generate a response right now.';
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          username: BOT_USERNAME,
          text,
          timestamp: Date.now(),
          isBot: true,
          isBigMessage: false,
          isForced: false,
          isSystem: false,
          isBroadcast: false,
        };
        sendMessage(botMsg);
      } catch {
        const errMsg: ChatMessage = {
          id: `bot-err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          username: BOT_USERNAME,
          text: 'Sorry, I encountered an error processing your request. 😔',
          timestamp: Date.now(),
          isBot: true,
          isBigMessage: false,
          isForced: false,
          isSystem: false,
          isBroadcast: false,
        };
        sendMessage(errMsg);
      } finally {
        isProcessing.current = false;
      }
    })();
  }, [messages, sendMessage]);
}
