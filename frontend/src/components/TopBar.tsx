import { Globe, Hash, Menu, Users, LogOut, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TopBarProps {
  username: string;
  onMenuClick: () => void;
  onLogout: () => void;
  onAdminPanel?: () => void;
}

export default function TopBar({ username, onMenuClick, onLogout, onAdminPanel }: TopBarProps) {
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    const readCount = () => {
      const raw = localStorage.getItem('globalchat_presence');
      if (!raw) { setOnlineCount(1); return; }
      const presence: Record<string, number> = JSON.parse(raw);
      const now = Date.now();
      const count = Object.values(presence).filter(ts => now - ts < 30000).length;
      setOnlineCount(Math.max(1, count));
    };
    readCount();
    const interval = setInterval(readCount, 5000);
    return () => clearInterval(interval);
  }, [username]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-12 bg-dc-chat border-b border-white/5 flex items-center px-4 gap-3 shrink-0 shadow-sm">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1 rounded text-dc-muted hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Channel info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Hash className="w-5 h-5 text-dc-muted shrink-0" />
          <span className="font-semibold text-white text-sm">global</span>
          <div className="hidden sm:block w-px h-4 bg-white/10 mx-1" />
          <span className="hidden sm:block text-xs text-dc-muted truncate">
            The global chat room — everyone is welcome!
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-dc-sidebar/60 px-2.5 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <Users className="w-3.5 h-3.5 text-dc-muted" />
            <span className="text-xs font-medium text-dc-text-secondary">{onlineCount}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <Globe className="w-4 h-4 text-dc-accent" />
            <span className="text-sm font-bold text-white">Global Chat</span>
          </div>

          {/* Admin Panel button — only for AI.Caffeine */}
          {onAdminPanel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAdminPanel}
                  className="p-1.5 rounded-md text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors"
                  aria-label="Admin Panel"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Admin Panel
              </TooltipContent>
            </Tooltip>
          )}

          {/* Logout button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-md text-dc-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Log Out
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
