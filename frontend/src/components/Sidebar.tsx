import { useState, useEffect } from 'react';
import { Hash, Users, LogOut, Globe, Circle } from 'lucide-react';
import { isVerifiedOwner, VerifiedOwnerBadge } from '../lib/userBadges';

interface SidebarProps {
  username: string;
  onLeave: () => void;
}

interface OnlineUser {
  name: string;
  lastSeen: number;
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

export default function Sidebar({ username, onLeave }: SidebarProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const updatePresence = () => {
      const key = 'globalchat_presence';
      const raw = localStorage.getItem(key);
      const presence: Record<string, number> = raw ? JSON.parse(raw) : {};
      presence[username] = Date.now();
      localStorage.setItem(key, JSON.stringify(presence));
    };

    updatePresence();
    const interval = setInterval(updatePresence, 10000);

    return () => {
      clearInterval(interval);
      const key = 'globalchat_presence';
      const raw = localStorage.getItem(key);
      if (raw) {
        const presence: Record<string, number> = JSON.parse(raw);
        delete presence[username];
        localStorage.setItem(key, JSON.stringify(presence));
      }
    };
  }, [username]);

  useEffect(() => {
    const readPresence = () => {
      const key = 'globalchat_presence';
      const raw = localStorage.getItem(key);
      if (!raw) {
        setOnlineUsers([{ name: username, lastSeen: Date.now() }]);
        return;
      }
      const presence: Record<string, number> = JSON.parse(raw);
      const now = Date.now();
      const active = Object.entries(presence)
        .filter(([, ts]) => now - ts < 30000)
        .map(([name, lastSeen]) => ({ name, lastSeen }))
        .sort((a, b) => b.lastSeen - a.lastSeen);

      if (!active.find(u => u.name === username)) {
        active.unshift({ name: username, lastSeen: Date.now() });
      }
      setOnlineUsers(active);
    };

    readPresence();
    const interval = setInterval(readPresence, 5000);
    return () => clearInterval(interval);
  }, [username]);

  return (
    <div className="w-60 h-full bg-dc-sidebar flex flex-col border-r border-white/5">
      {/* Server header */}
      <div className="h-12 px-4 flex items-center border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="w-4 h-4 text-dc-accent shrink-0" />
          <span className="font-semibold text-white text-sm truncate">Global Chat</span>
        </div>
      </div>

      {/* Channels section */}
      <div className="px-2 pt-4 pb-1">
        <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider px-2 mb-1">
          Channels
        </p>
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-dc-chat/60 text-white cursor-pointer">
          <Hash className="w-4 h-4 text-dc-muted" />
          <span className="text-sm font-medium">global</span>
        </div>
      </div>

      {/* Online users section */}
      <div className="px-2 pt-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-1.5 px-2 mb-2">
          <Users className="w-3.5 h-3.5 text-dc-muted" />
          <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider">
            Online — {onlineUsers.length}
          </p>
        </div>

        <div className="space-y-0.5">
          {onlineUsers.map((user) => (
            <div
              key={user.name}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-dc-chat/40 transition-colors group ${
                isVerifiedOwner(user.name) ? 'bg-yellow-500/5' : ''
              }`}
            >
              <div className="relative shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    isVerifiedOwner(user.name) ? 'ring-2 ring-yellow-400/50' : ''
                  }`}
                  style={{ backgroundColor: getAvatarColor(user.name) }}
                >
                  {user.name[0]?.toUpperCase()}
                </div>
                <Circle
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-green-500 text-dc-sidebar"
                  strokeWidth={2}
                />
              </div>
              <div className="flex items-center gap-0.5 flex-1 min-w-0">
                <span className={`text-sm truncate ${
                  isVerifiedOwner(user.name)
                    ? 'text-yellow-300 font-semibold'
                    : user.name === username
                    ? 'text-white font-medium'
                    : 'text-dc-text-secondary'
                }`}>
                  {user.name}
                  {user.name === username && !isVerifiedOwner(user.name) && (
                    <span className="text-dc-muted text-xs ml-1">(you)</span>
                  )}
                </span>
                {isVerifiedOwner(user.name) && (
                  <VerifiedOwnerBadge />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User panel at bottom */}
      <div className="h-14 px-2 flex items-center gap-2 bg-dc-bg/50 border-t border-white/5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
            isVerifiedOwner(username) ? 'ring-2 ring-yellow-400/50' : ''
          }`}
          style={{ backgroundColor: getAvatarColor(username) }}
        >
          {username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className={`text-sm font-medium truncate ${isVerifiedOwner(username) ? 'text-yellow-300' : 'text-white'}`}>
              {username}
            </p>
            {isVerifiedOwner(username) && <VerifiedOwnerBadge />}
          </div>
          <p className="text-xs text-green-400">● Online</p>
        </div>
        <button
          onClick={onLeave}
          title="Log out"
          className="p-1.5 rounded-md text-dc-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
