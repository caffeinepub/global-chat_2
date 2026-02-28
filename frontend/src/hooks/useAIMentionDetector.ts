import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { chatCompletion, getOpenAIKey } from '../lib/openai';

const MENTION_PATTERN = /@G\.ai\s+(.+)/i;
const BOT_USERNAME = 'G.AI 🤖';

type SendMessageFn = (text: string, overrideUsername?: string, isBot?: boolean) => ChatMessage;

export function useAIMentionDetector(
  messages: ChatMessage[],
  sendMessage: SendMessageFn
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
        sendMessage(text, BOT_USERNAME, true);
      } catch {
        sendMessage(
          'Sorry, I encountered an error processing your request. 😔',
          BOT_USERNAME,
          true
        );
      } finally {
        isProcessing.current = false;
      }
    })();
  }, [messages, sendMessage]);
}
