import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";
import { isVerifiedOwner, VerifiedOwnerBadge } from "@/lib/userBadges";
import PinnedMessageBar from "./PinnedMessageBar";
import MOTDBanner from "./MOTDBanner";

interface ChatAreaProps {
  messages: ChatMessage[];
  currentUsername: string;
}

interface PinnedMessage {
  id: string;
  username: string;
  text: string;
}

function getAvatarColor(username: string): string {
  const colors = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245",
    "#3BA55D", "#FAA61A", "#00B0F4", "#9B59B6", "#E91E63",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatArea({ messages, currentUsername }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [motd, setMotd] = useState<string | null>(null);
  const [motdDismissed, setMotdDismissed] = useState(false);

  // Load pinned message from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("globalchat_pinned");
    if (raw) {
      try { setPinnedMessage(JSON.parse(raw)); } catch {}
    }

    const rawHighlights = localStorage.getItem("globalchat_highlights");
    if (rawHighlights) {
      try { setHighlights(JSON.parse(rawHighlights)); } catch {}
    }

    const rawMotd = localStorage.getItem("globalchat_motd");
    if (rawMotd) setMotd(rawMotd);
  }, []);

  // BroadcastChannel for real-time updates (v9 only events)
  useEffect(() => {
    const channel = new BroadcastChannel("globalchat_server_control");
    channel.onmessage = (event) => {
      const { type, ...payload } = event.data || {};
      switch (type) {
        case "pin_message":
          setPinnedMessage({ id: payload.id, username: payload.username, text: payload.text });
          localStorage.setItem("globalchat_pinned", JSON.stringify({ id: payload.id, username: payload.username, text: payload.text }));
          break;
        case "unpin_message":
          setPinnedMessage(null);
          localStorage.removeItem("globalchat_pinned");
          break;
        case "highlight_user":
          setHighlights(prev => {
            const updated = { ...prev, [payload.username]: payload.color };
            localStorage.setItem("globalchat_highlights", JSON.stringify(updated));
            return updated;
          });
          break;
        case "set_motd":
          setMotd(payload.motd);
          setMotdDismissed(false);
          localStorage.setItem("globalchat_motd", payload.motd);
          break;
        case "clear_motd":
          setMotd(null);
          localStorage.removeItem("globalchat_motd");
          break;
        default:
          break;
      }
    };
    return () => channel.close();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUnpin = () => {
    setPinnedMessage(null);
    localStorage.removeItem("globalchat_pinned");
    try {
      const ch = new BroadcastChannel("globalchat_server_control");
      ch.postMessage({ type: "unpin_message" });
      ch.close();
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#313338" }}>
      {/* MOTD Banner */}
      {motd && !motdDismissed && (
        <MOTDBanner motd={motd} onDismiss={() => setMotdDismissed(true)} />
      )}

      {/* Pinned Message */}
      {pinnedMessage && (
        <PinnedMessageBar
          message={pinnedMessage}
          onUnpin={handleUnpin}
          isOwner={currentUsername === "AI.Caffeine"}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: "#96989d" }}>
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">No messages yet. Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwner = isVerifiedOwner(msg.username);
          const highlightColor = highlights[msg.username];
          const isCurrentUser = msg.username === currentUsername;

          // System messages
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex items-center gap-2 py-1 px-2">
                <div className="flex-1 text-center">
                  <span className="text-xs italic" style={{ color: "#96989d" }}>{msg.text}</span>
                </div>
              </div>
            );
          }

          // Big messages
          if (msg.isBigMessage) {
            return (
              <div
                key={msg.id}
                className="my-3 px-4 py-3 rounded-r-lg animate-slide-in"
                style={{
                  backgroundColor: "#5865f220",
                  borderLeft: "4px solid #5865f2",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📢</span>
                  <span className="font-semibold text-sm" style={{ color: "#5865f2" }}>{msg.username}</span>
                  <span className="text-xs" style={{ color: "#96989d" }}>{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-white text-lg font-semibold">{msg.text}</p>
              </div>
            );
          }

          // Regular messages
          const avatarColor = getAvatarColor(msg.username);
          const avatarLetter = msg.username.charAt(0).toUpperCase();
          const usernameColor = highlightColor || (isOwner ? "#FAA61A" : avatarColor);

          return (
            <div
              key={msg.id}
              className="flex items-start gap-3 py-1 px-2 rounded group animate-slide-in"
              style={highlightColor ? {
                boxShadow: `0 0 8px ${highlightColor}40`,
                borderLeft: `3px solid ${highlightColor}`,
              } : {}}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#2e3035";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5"
                style={{ backgroundColor: isOwner ? "#FAA61A" : avatarColor }}
              >
                {avatarLetter}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: usernameColor }}>
                    {msg.username}
                  </span>
                  {isOwner && <VerifiedOwnerBadge />}
                  {msg.isBot && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: "#5865f220", color: "#5865f2" }}
                    >
                      BOT
                    </span>
                  )}
                  {msg.isForced && currentUsername === "AI.Caffeine" && (
                    <span className="text-xs" style={{ color: "#96989d" }} title="Force text message">👻</span>
                  )}
                  <span className="text-xs" style={{ color: "#96989d" }}>{formatTime(msg.timestamp)}</span>
                </div>
                <p
                  className="text-sm leading-relaxed break-words"
                  style={{ color: isCurrentUser ? "#ffffff" : "#dcddde" }}
                >
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
