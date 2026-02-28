// Singleton BroadcastChannel utility for globalchat_server_control

const CHANNEL_NAME = 'globalchat_server_control';

type BroadcastCallback = (event: { eventType: string; payload: unknown; timestamp: number }) => void;

const callbacks: Set<BroadcastCallback> = new Set();
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e) => {
      callbacks.forEach(cb => cb(e.data));
    };
  }
  return channel;
}

export function broadcastEvent(eventType: string, payload?: unknown): void {
  try {
    getChannel().postMessage({ eventType, payload, timestamp: Date.now() });
  } catch {
    // ignore
  }
}

export function subscribeToBroadcast(callback: BroadcastCallback): void {
  callbacks.add(callback);
  // Ensure channel is open
  getChannel();
}

export function unsubscribeFromBroadcast(callback: BroadcastCallback): void {
  callbacks.delete(callback);
}
