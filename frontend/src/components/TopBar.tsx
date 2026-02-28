import { useEffect, useState, useCallback } from 'react';
import { Hash, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  channelName?: string;
  onlineCount: number;
  onLogout: () => void;
  onAdminPanel?: () => void;
}

export default function TopBar({ channelName = 'general', onlineCount, onLogout, onAdminPanel }: Props) {
  const [partyActive, setPartyActive] = useState(false);

  const refreshState = useCallback(() => {
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
    <header
      className={`h-12 flex items-center px-4 gap-3 border-b border-white/10 shrink-0 transition-colors duration-500 ${partyActive ? 'animate-party-bg' : 'bg-dc-chat'}`}
    >
      <Hash className="w-5 h-5 text-dc-muted shrink-0" />
      <span className="font-semibold text-white text-sm">{channelName}</span>
      <span className="text-dc-muted text-xs">·</span>
      <span className="text-dc-muted text-xs">{onlineCount} online</span>

      <div className="ml-auto flex items-center gap-2">
        {onAdminPanel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onAdminPanel}
            className="h-7 px-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 text-xs gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </Button>
        )}
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
    </header>
  );
}
