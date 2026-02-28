import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat';
import { seedSampleMessagesIfEmpty } from '../utils/sampleMessages';
import { useActor } from './useActor';

const STORAGE_KEY = 'globalchat_messages';
const CHANNEL_NAME = 'globalchat_broadcast';
const MAX_MESSAGES = 500;
const POLL_INTERVAL_MS = 2000;

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

/** Convert backend ChatMessage (bigint timestamp) to frontend ChatMessage (number timestamp) */
function fromBackendMessage(msg: {
  id: string;
  username: string;
  text: string;
  timestamp: bigint;
  isBot: boolean;
  isBigMessage: boolean;
  isForced: boolean;
  isSystem: boolean;
  isBroadcast: boolean;
}): ChatMessage {
  return {
    id: msg.id,
    username: msg.username,
    text: msg.text,
    // Backend stores nanoseconds (ICP Time), convert to milliseconds
    timestamp: Number(msg.timestamp / 1_000_000n),
    isBot: msg.isBot,
    isBigMessage: msg.isBigMessage,
    isForced: msg.isForced,
    isSystem: msg.isSystem,
    isBroadcast: msg.isBroadcast,
  };
}

export function useBroadcastMessages(username: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => seedSampleMessagesIfEmpty());
  const channelRef = useRef<BroadcastChannel | null>(null);
  const { actor } = useActor();
  const actorRef = useRef(actor);
  const latestTimestampRef = useRef<bigint>(0n);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep actorRef in sync
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  // Initialize BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, message } = event.data;
      if (type === 'NEW_MESSAGE' && message) {
        setMessages(prev => {
          // Avoid duplicates by id
          if (prev.find(m => m.id === message.id)) return prev;
          const updated = [...prev, message];
          saveMessages(updated);
          return updated;
        });
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

  // Poll backend for new messages every 2 seconds
  useEffect(() => {
    const poll = async () => {
      const currentActor = actorRef.current;
      if (!currentActor) return;

      try {
        const since = latestTimestampRef.current;
        const backendMessages = await currentActor.getMessages(since);

        if (backendMessages.length === 0) return;

        // Update the latest timestamp tracker
        const maxTs = backendMessages.reduce((max, m) => {
          return m.timestamp > max ? m.timestamp : max;
        }, since);
        latestTimestampRef.current = maxTs;

        const converted = backendMessages.map(fromBackendMessage);

        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = converted.filter(m => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;

          // Sort all messages by timestamp
          const updated = [...prev, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp);
          const trimmed = updated.slice(-MAX_MESSAGES);
          saveMessages(trimmed);
          return trimmed;
        });
      } catch {
        // Silently fail polling errors
      }
    };

    // Start polling
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    // Also poll immediately when actor becomes available
    poll();

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [actor]);

  const sendMessage = useCallback((
    text: string,
    overrideUsername?: string,
    isBot?: boolean,
    extras?: Partial<Pick<ChatMessage, 'isBigMessage' | 'isForced' | 'isSystem' | 'isBroadcast'>>
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nowMs = Date.now();

    const message: ChatMessage = {
      id,
      username: overrideUsername ?? username,
      text,
      timestamp: nowMs,
      isBot: isBot ?? false,
      isBigMessage: extras?.isBigMessage ?? false,
      isForced: extras?.isForced ?? false,
      isSystem: extras?.isSystem ?? false,
      isBroadcast: extras?.isBroadcast ?? false,
    };

    // Optimistically add to local state
    setMessages(prev => {
      if (prev.find(m => m.id === message.id)) return prev;
      const updated = [...prev, message];
      saveMessages(updated);
      return updated;
    });

    // Broadcast to other tabs in the same browser
    channelRef.current?.postMessage({ type: 'NEW_MESSAGE', message });

    // Persist to backend for cross-device sync
    const currentActor = actorRef.current;
    if (currentActor) {
      // Convert ms timestamp to nanoseconds for ICP backend
      const timestampNs = BigInt(nowMs) * 1_000_000n;

      currentActor.postMessage({
        id,
        username: overrideUsername ?? username,
        text,
        timestamp: timestampNs,
        isBot: isBot ?? false,
        isBigMessage: extras?.isBigMessage ?? false,
        isForced: extras?.isForced ?? false,
        isSystem: extras?.isSystem ?? false,
        isBroadcast: extras?.isBroadcast ?? false,
      }).catch(() => {
        // Silently fail — message is already in local state
      });
    }

    return message;
  }, [username]);

  const clearMessages = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
  }, []);

  return { messages, sendMessage, clearMessages };
}
