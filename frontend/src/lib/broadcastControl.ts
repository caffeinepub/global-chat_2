// BroadcastChannel wrapper with try/catch guards for environments where it may be unavailable

type BroadcastEventHandler = (event: MessageEvent) => void;

let channel: BroadcastChannel | null = null;

try {
  channel = new BroadcastChannel("globalchat_control");
} catch (e) {
  console.error("broadcastControl: BroadcastChannel unavailable", e);
  channel = null;
}

const subscribers: Map<string, Set<BroadcastEventHandler>> = new Map();

function handleMessage(event: MessageEvent): void {
  try {
    const { type } = event.data || {};
    if (!type) return;
    const handlers = subscribers.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (e) {
          console.error("broadcastControl: handler error", e);
        }
      });
    }
    // Also call wildcard subscribers
    const wildcardHandlers = subscribers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (e) {
          console.error("broadcastControl: wildcard handler error", e);
        }
      });
    }
  } catch (e) {
    console.error("broadcastControl: handleMessage error", e);
  }
}

if (channel) {
  channel.addEventListener("message", handleMessage);
}

export function subscribe(
  eventType: string,
  handler: BroadcastEventHandler
): void {
  try {
    if (!subscribers.has(eventType)) {
      subscribers.set(eventType, new Set());
    }
    subscribers.get(eventType)!.add(handler);
  } catch (e) {
    console.error("broadcastControl: subscribe error", e);
  }
}

export function unsubscribe(
  eventType: string,
  handler: BroadcastEventHandler
): void {
  try {
    const handlers = subscribers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  } catch (e) {
    console.error("broadcastControl: unsubscribe error", e);
  }
}

export function broadcastEvent(type: string, payload?: unknown): void {
  try {
    if (channel) {
      channel.postMessage({ type, ...(payload ? { payload } : {}) });
    }
  } catch (e) {
    console.error("broadcastControl: broadcastEvent error", e);
  }
}
