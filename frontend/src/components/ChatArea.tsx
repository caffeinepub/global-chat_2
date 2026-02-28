import { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { isVerifiedOwner, VerifiedOwnerBadge } from '../lib/userBadges';
import { usePinnedMessages } from '../hooks/usePinnedMessages';
import { useHighlights } from '../hooks/useHighlights';
import { useMOTD } from '../hooks/useMOTD';
import PinnedMessageBar from './PinnedMessageBar';
import MOTDBanner from './MOTDBanner';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentUsername?: string;
}

const AVATAR_COLORS = [
  '#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
  '#3ba55c', '#faa61a', '#00b0f4', '#9b59b6', '#e67e22',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

function renderMessageText(text: string) {
  const parts = text.split(/(@G\.ai)/gi);
  return parts.map((part, i) =>
    /^@G\.ai$/i.test(part)
      ? <span key={i} className="text-dc-accent font-semibold">{part}</span>
      : <span key={i}>{part}</span>
  );
}

export default function ChatArea({ messages, currentUsername }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const isAdmin = currentUsername === 'AI.Caffeine';

  const { pinnedMessageId } = usePinnedMessages();
  const { isUserHighlighted } = useHighlights();
  const { motdMessage, dismissMOTD } = useMOTD();

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const groupedMessages = messages.reduce<Array<ChatMessage & { isGrouped: boolean }>>((acc, msg, i) => {
    const prev = messages[i - 1];
    const isGrouped = !!(
      prev &&
      prev.username === msg.username &&
      msg.timestamp - prev.timestamp < 5 * 60 * 1000 &&
      !msg.isBot &&
      !prev.isBot &&
      !msg.isBigMessage &&
      !prev.isBigMessage
    );
    acc.push({ ...msg, isGrouped });
    return acc;
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* MOTD Banner */}
      {motdMessage && (
        <MOTDBanner message={motdMessage} onDismiss={dismissMOTD} />
      )}

      {/* Pinned Message Bar */}
      {pinnedMessageId && (
        <PinnedMessageBar messageId={pinnedMessageId} messages={messages} />
      )}

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 transparent' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-dc-sidebar rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">Welcome to #global!</h3>
            <p className="text-dc-muted text-sm">This is the beginning of the global chat.</p>
          </div>
        )}

        {groupedMessages.map((msg) => {
          // Big Message: full-width banner
          if (msg.isBigMessage) {
            return (
              <div
                key={msg.id}
                className="w-full my-3 rounded-xl overflow-hidden border border-yellow-400/30 shadow-lg shadow-yellow-500/10 message-slide-in"
              >
                <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-yellow-500/20 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0 mt-0.5">📢</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-bold text-sm text-yellow-300">{msg.username}</span>
                        {isVerifiedOwner(msg.username) && <VerifiedOwnerBadge />}
                        <span className="text-[10px] bg-yellow-500/30 text-yellow-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-yellow-400/30">
                          SERVER ANNOUNCEMENT
                        </span>
                        <span className="text-xs text-yellow-200/50">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-white font-bold text-lg leading-snug break-words">{msg.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Check highlight
          const highlightColor = isUserHighlighted(msg.username);

          // Normal message
          return (
            <div
              key={msg.id}
              className={`
                group flex gap-3 px-2 py-0.5 rounded-md transition-colors duration-100
                hover:bg-white/[0.03]
                ${msg.isBot ? 'bg-dc-accent/5 border-l-2 border-dc-accent/40 pl-3 my-1' : ''}
                ${isVerifiedOwner(msg.username) ? 'bg-yellow-500/5 border-l-2 border-yellow-500/30 pl-3 my-0.5' : ''}
                ${msg.isGrouped ? 'mt-0' : 'mt-3'}
                message-slide-in
              `}
              style={highlightColor ? {
                boxShadow: `0 0 0 1px ${highlightColor}40, 0 0 12px ${highlightColor}20`,
                borderLeft: `2px solid ${highlightColor}`,
                paddingLeft: '12px',
              } : undefined}
            >
              {/* Avatar or spacer */}
              {!msg.isGrouped ? (
                <div className="shrink-0 mt-0.5">
                  {msg.isBot ? (
                    <div className="w-9 h-9 rounded-full bg-dc-accent flex items-center justify-center text-white text-base shadow-md shadow-dc-accent/30">
                      🤖
                    </div>
                  ) : isVerifiedOwner(msg.username) ? (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-yellow-400/50"
                      style={{ backgroundColor: getAvatarColor(msg.username) }}
                    >
                      {msg.username[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: getAvatarColor(msg.username) }}
                    >
                      {msg.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-9 shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-dc-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {!msg.isGrouped && (
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`font-semibold text-sm ${msg.isBot ? 'text-dc-accent' : isVerifiedOwner(msg.username) ? 'text-yellow-300' : 'text-white'}`}>
                      {msg.username}
                    </span>
                    {msg.isBot && (
                      <span className="text-[10px] bg-dc-accent text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                        BOT
                      </span>
                    )}
                    {isVerifiedOwner(msg.username) && <VerifiedOwnerBadge />}
                    {msg.isForced && isAdmin && (
                      <span
                        title="Force-sent by AI.Caffeine"
                        className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-500/30 flex items-center gap-0.5"
                      >
                        👻 FORCED
                      </span>
                    )}
                    {highlightColor && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-bold border"
                        style={{ color: highlightColor, borderColor: `${highlightColor}40`, backgroundColor: `${highlightColor}15` }}
                      >
                        ✨ HIGHLIGHTED
                      </span>
                    )}
                    <span className="text-xs text-dc-muted">{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <p className="text-dc-text text-sm leading-relaxed break-words">
                  {renderMessageText(msg.text)}
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
