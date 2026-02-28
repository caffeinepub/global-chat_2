import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChatMessage } from '../types/chat';
import { isVerifiedOwner, VerifiedOwnerBadge } from '../lib/userBadges';

interface Props {
  messages: ChatMessage[];
  currentUsername: string;
}

interface FunState {
  rainbowActive: boolean;
  flipActive: boolean;
  bigheadActive: boolean;
  shakeActive: boolean;
  ghostUsers: Record<string, number>;
  vipUsers: string[];
  nicknames: Record<string, { nick: string; expiry: number }>;
  avatarColors: Record<string, string>;
}

function getAvatarColor(username: string, customColors: Record<string, string>): string {
  if (customColors[username]) return customColors[username];
  const colors = [
    '#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
    '#3ba55d', '#faa61a', '#00b0f4', '#9b59b6', '#e67e22',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function checkExpiry(expiry: number): boolean {
  return Date.now() < expiry;
}

function loadFunState(): FunState {
  const now = Date.now();

  // Rainbow
  let rainbowActive = false;
  try {
    const raw = localStorage.getItem('globalchat_rainbow_mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      rainbowActive = parsed.expiry > now;
    }
  } catch { /* ignore */ }

  // Flip
  let flipActive = false;
  try {
    const raw = localStorage.getItem('globalchat_flip_mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      flipActive = parsed.expiry > now;
    }
  } catch { /* ignore */ }

  // Bighead
  let bigheadActive = false;
  try {
    const raw = localStorage.getItem('globalchat_bighead');
    if (raw) {
      const parsed = JSON.parse(raw);
      bigheadActive = parsed.expiry > now;
    }
  } catch { /* ignore */ }

  // Shake
  let shakeActive = false;
  try {
    const raw = localStorage.getItem('globalchat_shake_mode');
    if (raw) {
      const parsed = JSON.parse(raw);
      shakeActive = parsed.expiry > now;
    }
  } catch { /* ignore */ }

  // Ghost users
  let ghostUsers: Record<string, number> = {};
  try {
    const raw = localStorage.getItem('globalchat_ghost_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Filter expired
      Object.entries(parsed).forEach(([u, exp]) => {
        if ((exp as number) > now) ghostUsers[u] = exp as number;
      });
    }
  } catch { /* ignore */ }

  // VIP users
  let vipUsers: string[] = [];
  try {
    const raw = localStorage.getItem('globalchat_vip_users');
    if (raw) vipUsers = JSON.parse(raw);
  } catch { /* ignore */ }

  // Nicknames
  let nicknames: Record<string, { nick: string; expiry: number }> = {};
  try {
    const raw = localStorage.getItem('globalchat_nicknames');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([u, data]) => {
        const d = data as { nick: string; expiry: number };
        if (d.expiry > now) nicknames[u] = d;
      });
    }
  } catch { /* ignore */ }

  // Avatar colors
  let avatarColors: Record<string, string> = {};
  try {
    const raw = localStorage.getItem('globalchat_avatar_colors');
    if (raw) avatarColors = JSON.parse(raw);
  } catch { /* ignore */ }

  return { rainbowActive, flipActive, bigheadActive, shakeActive, ghostUsers, vipUsers, nicknames, avatarColors };
}

export default function ChatArea({ messages, currentUsername }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [funState, setFunState] = useState<FunState>(loadFunState);

  const refreshFunState = useCallback(() => {
    setFunState(loadFunState());
  }, []);

  useEffect(() => {
    const ch = new BroadcastChannel('globalchat_server_control');
    ch.onmessage = () => refreshFunState();
    return () => ch.close();
  }, [refreshFunState]);

  // Poll for expiry every 5 seconds
  useEffect(() => {
    const interval = setInterval(refreshFunState, 5000);
    return () => clearInterval(interval);
  }, [refreshFunState]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { rainbowActive, flipActive, bigheadActive, shakeActive, ghostUsers, vipUsers, nicknames, avatarColors } = funState;

  const avatarSize = bigheadActive ? 'w-12 h-12 text-base' : 'w-8 h-8 text-xs';

  return (
    <div
      className={`flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-dc-sidebar scrollbar-track-transparent ${shakeActive ? 'animate-shake-messages' : ''}`}
      style={flipActive ? { transform: 'scaleY(-1)' } : undefined}
    >
      {messages.map((msg) => {
        const isOwn = msg.username === currentUsername;
        const isGhost = !!ghostUsers[msg.username] && checkExpiry(ghostUsers[msg.username]);
        const isVIP = vipUsers.includes(msg.username);
        const nickname = nicknames[msg.username];
        const avatarColor = getAvatarColor(msg.username, avatarColors);
        const isOwner = isVerifiedOwner(msg.username);

        // Big message / announcement
        if (msg.isBigMessage) {
          return (
            <div
              key={msg.id}
              className="my-3 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-semibold text-sm flex items-start gap-2"
              style={flipActive ? { transform: 'scaleY(-1)' } : undefined}
            >
              <span className="text-lg shrink-0">📢</span>
              <span className={rainbowActive ? 'animate-rainbow-text' : ''}>{msg.text}</span>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 px-2 py-1 rounded hover:bg-white/5 group transition-colors ${isGhost ? 'opacity-30' : ''}`}
            style={flipActive ? { transform: 'scaleY(-1)' } : undefined}
          >
            {/* Avatar */}
            <div
              className={`${avatarSize} rounded-full flex items-center justify-center font-bold text-white shrink-0 transition-all`}
              style={{ backgroundColor: avatarColor }}
            >
              {isGhost ? '👻' : msg.username.charAt(0).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span
                  className={`font-semibold text-sm ${isOwner ? 'text-yellow-400' : 'text-white/90'}`}
                >
                  {isGhost && '👻 '}
                  {msg.username}
                  {nickname && ` [${nickname.nick}]`}
                </span>
                {isOwner && <VerifiedOwnerBadge />}
                {isVIP && <span className="text-yellow-400 text-xs" title="VIP">👑</span>}
                {msg.isForced && currentUsername === 'AI.Caffeine' && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-1 rounded">👻 FORCED</span>
                )}
                <span className="text-xs text-dc-muted ml-1">
                  {new Date(Number(msg.timestamp) / 1_000_000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p
                className={`text-sm text-white/80 break-words whitespace-pre-wrap mt-0.5 ${rainbowActive ? 'animate-rainbow-text' : ''}`}
              >
                {msg.text}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
