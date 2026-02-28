import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat';
import { seedSampleMessagesIfEmpty } from '../utils/sampleMessages';

const STORAGE_KEY = 'globalchat_messages';
const CHANNEL_NAME = 'globalchat_broadcast';
const MAX_MESSAGES = 500;

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  const trimmed = messages.slice(-MAX_MESSAGES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function useBroadcastMessages(username: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => seedSampleMessagesIfEmpty());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, message } = event.data;
      if (type === 'NEW_MESSAGE' && message) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === message.id)) return prev;
          const updated = [...prev, message];
          saveMessages(updated);
          return updated;
        });
      } else if (type === 'CLEAR_MESSAGES') {
        // Don't clear on broadcast — clear is local only
      }
    };

    // Sync from localStorage on focus (another tab may have added messages)
    const handleFocus = () => {
      const stored = loadMessages();
      setMessages(stored);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      channel.close();
      channelRef.current = null;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const sendMessage = useCallback((
    text: string,
    overrideUsername?: string,
    isBot?: boolean,
    extras?: Partial<Pick<ChatMessage, 'isBigMessage' | 'isForced'>>
  ) => {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username: overrideUsername ?? username,
      text,
      timestamp: Date.now(),
      isBot: isBot ?? false,
      ...(extras ?? {}),
    };

    setMessages(prev => {
      const updated = [...prev, message];
      saveMessages(updated);
      return updated;
    });

    // Broadcast to other tabs
    channelRef.current?.postMessage({ type: 'NEW_MESSAGE', message });

    return message;
  }, [username]);

  const clearMessages = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }, []);

  return { messages, sendMessage, clearMessages };
}
