import { useEffect, useState, useCallback } from 'react';
import { Hash, Volume2, LogOut, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isVerifiedOwner, VerifiedOwnerBadge } from '../lib/userBadges';

interface Props {
  currentUsername: string;
  onlineUsers: string[];
  onLogout: () => void;
}

const CHANNELS = [
  { name: 'general', icon: Hash },
  { name: 'announcements', icon: Volume2 },
];

export default function Sidebar({ currentUsername, onlineUsers, onLogout }: Props) {
  const [vipUsers, setVipUsers] = useState<string[]>([]);
  const [partyActive, setPartyActive] = useState(false);

  const refreshState = useCallback(() => {
    try {
      const raw = localStorage.getItem('globalchat_vip_users');
      setVipUsers(raw ? JSON.parse(raw) : []);
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem('globalchat_party_mode');
      if (raw) {
        const parsed = JSON.parse(raw);
        setPartyActive(parsed.expiry > Date.now());
      } else {
        setPartyActive(false);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshState();
    const ch = new BroadcastChannel('globalchat_server_control');
    ch.onmessage = () => refreshState();
    const interval = setInterval(refreshState, 5000);
    return () => {
      ch.close();
      clearInterval(interval);
    };
  }, [refreshState]);

  return (
    <aside
      className={`w-60 flex flex-col shrink-0 border-r border-white/10 transition-colors duration-500 ${partyActive ? 'animate-party-bg' : 'bg-dc-sidebar'}`}
    >
      {/* Server name */}
      <div className="h-12 flex items-center px-4 border-b border-white/10 shrink-0">
        <h1 className="font-bold text-white text-sm truncate">🌐 Global Chat</h1>
      </div>

      {/* Channels */}
      <div className="px-2 pt-4 pb-2">
        <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider px-2 mb-1">
          Text Channels
        </p>
        {CHANNELS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
              name === 'general'
                ? 'bg-white/10 text-white'
                : 'text-dc-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{name}</span>
          </button>
        ))}
      </div>

      {/* Online Users */}
      <div className="flex-1 overflow-hidden px-2 pt-2">
        <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Online — {onlineUsers.length}
        </p>
        <ScrollArea className="h-full">
          <div className="space-y-0.5 pb-2">
            {onlineUsers.map((user) => {
              const owner = isVerifiedOwner(user);
              const isVIP = vipUsers.includes(user);
              return (
                <div
                  key={user}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span
                    className={`text-sm truncate flex-1 ${owner ? 'text-yellow-400 font-semibold' : 'text-dc-muted'}`}
                  >
                    {user}
                  </span>
                  {owner && <VerifiedOwnerBadge />}
                  {isVIP && <span className="text-yellow-400 text-xs" title="VIP">👑</span>}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* User panel */}
      <div className="h-14 flex items-center px-3 gap-2 border-t border-white/10 bg-dc-bg/30 shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: '#5865f2' }}
        >
          {currentUsername.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-white font-medium truncate flex-1">{currentUsername}</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onLogout}
          className="h-7 w-7 text-dc-muted hover:text-red-400 hover:bg-red-400/10"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  );
}
