import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types/chat';
import { useActor } from './useActor';

const STORAGE_KEY = 'globalchat_messages';
const CHANNEL_NAME = 'globalchat_broadcast';
const POLL_INTERVAL_MS = 2000;

// Create a stable fingerprint for deduplication that works across devices.
// We bucket timestamps to 5-second windows to tolerate minor clock skew.
function msgFingerprint(msg: ChatMessage): string {
  const tsBucket = Math.floor(msg.timestamp / 5000);
  return `${msg.username}|${msg.text}|${tsBucket}`;
}

function toBackendMessage(msg: ChatMessage): import('../backend').ChatMessage {
  const nowMs = msg.timestamp || Date.now();
  return {
    id: msg.id,
    username: msg.username,
    text: msg.text,
    timestamp: BigInt(nowMs) * 1_000_000n,
    isBigMessage: msg.isBigMessage ?? false,
    isForced: msg.isForced ?? false,
    isBot: msg.isBot ?? false,
    isSystem: msg.isSystem ?? false,
    isBroadcast: msg.isBroadcast ?? false,
  };
}

function fromBackendMessage(msg: import('../backend').ChatMessage): ChatMessage {
  return {
    id: msg.id,
    username: msg.username,
    text: msg.text,
    timestamp: Number(msg.timestamp / 1_000_000n),
    isBigMessage: msg.isBigMessage,
    isForced: msg.isForced,
    isBot: msg.isBot,
    isSystem: msg.isSystem,
    isBroadcast: msg.isBroadcast,
  };
}

export function useBroadcastMessages() {
  // Start with empty state; backend is the authoritative source
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { actor, isFetching } = useActor();
  const actorRef = useRef(actor);
  const latestTimestampRef = useRef<bigint>(0n);
  const channelRef = useRef<BroadcastChannel | null>(null);
  // Track fingerprints for deduplication (works across devices since backend reassigns IDs)
  const fingerprintsRef = useRef<Set<string>>(new Set());

  // Keep actor ref in sync
  useEffect(() => { actorRef.current = actor; }, [actor]);

  // Persist to localStorage as a cache whenever messages change
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, initialized]);

  // Merge backend messages into state using fingerprint deduplication
  const mergeBackendMessages = useCallback((backendMsgs: ChatMessage[]) => {
    if (backendMsgs.length === 0) return;
    setMessages(prev => {
      // Rebuild fingerprint set from current state
      const fps = new Set(prev.map(msgFingerprint));
      const newMsgs = backendMsgs.filter(m => {
        const fp = msgFingerprint(m);
        if (fps.has(fp)) return false;
        fps.add(fp);
        return true;
      });
      if (newMsgs.length === 0) return prev;
      const merged = [...prev, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp);
      // Keep only last 500 messages in memory
      return merged.slice(-500);
    });
    // Update the shared fingerprint ref
    backendMsgs.forEach(m => fingerprintsRef.current.add(msgFingerprint(m)));
  }, []);

  // Poll backend for new messages
  useEffect(() => {
    if (!actor || isFetching) return;

    const poll = async () => {
      const currentActor = actorRef.current;
      if (!currentActor) return;
      try {
        const backendMsgs = await currentActor.getMessages(latestTimestampRef.current);
        if (backendMsgs.length > 0) {
          const converted = backendMsgs.map(fromBackendMessage);
          // Update latest timestamp to the max we've seen
          const maxTs = backendMsgs.reduce(
            (max, m) => (m.timestamp > max ? m.timestamp : max),
            latestTimestampRef.current
          );
          latestTimestampRef.current = maxTs;
          mergeBackendMessages(converted);
        }
        if (!initialized) setInitialized(true);
      } catch {
        // silently ignore poll errors
      }
    };

    // Immediate fetch on mount / actor becoming ready
    poll();

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [actor, isFetching, mergeBackendMessages, initialized]);

  // BroadcastChannel for same-browser tab sync (secondary optimization)
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const incoming: ChatMessage = event.data;
      if (!incoming?.id) return;
      const fp = msgFingerprint(incoming);
      if (fingerprintsRef.current.has(fp)) return;
      fingerprintsRef.current.add(fp);
      setMessages(prev => {
        const merged = [...prev, incoming].sort((a, b) => a.timestamp - b.timestamp);
        return merged.slice(-500);
      });
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((msg: ChatMessage) => {
    const fp = msgFingerprint(msg);

    // Add to local state immediately for instant feedback
    fingerprintsRef.current.add(fp);
    setMessages(prev => {
      if (fingerprintsRef.current.has(fp) && prev.some(m => msgFingerprint(m) === fp)) {
        // Already present — skip
        return prev;
      }
      const merged = [...prev, msg].sort((a, b) => a.timestamp - b.timestamp);
      return merged.slice(-500);
    });

    // Broadcast to other tabs in the same browser
    channelRef.current?.postMessage(msg);

    // Persist to backend for cross-device visibility
    const currentActor = actorRef.current;
    if (currentActor) {
      currentActor.postMessage(toBackendMessage(msg)).catch(() => {});
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    fingerprintsRef.current.clear();
    latestTimestampRef.current = 0n;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, sendMessage, clearMessages };
}
