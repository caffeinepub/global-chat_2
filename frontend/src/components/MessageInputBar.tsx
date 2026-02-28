import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onSend: (text: string) => void;
  currentUsername: string;
  disabled?: boolean;
}

function getFrozenExpiry(username: string): number | null {
  try {
    const raw = localStorage.getItem('globalchat_frozen');
    if (!raw) return null;
    const frozen: Record<string, number> = JSON.parse(raw);
    const expiry = frozen[username];
    if (!expiry || Date.now() > expiry) return null;
    return expiry;
  } catch {
    return null;
  }
}

function getBanExpiry(username: string): number | null {
  try {
    const raw = localStorage.getItem('globalchat_bans');
    if (!raw) return null;
    const bans: Record<string, number> = JSON.parse(raw);
    const expiry = bans[username];
    if (!expiry || Date.now() > expiry) return null;
    return expiry;
  } catch {
    return null;
  }
}

export default function MessageInputBar({ onSend, currentUsername, disabled }: Props) {
  const [text, setText] = useState('');
  const [frozenExpiry, setFrozenExpiry] = useState<number | null>(null);
  const [banExpiry, setBanExpiry] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBot = currentUsername === 'G.AI 🤖';

  const checkStatus = useCallback(() => {
    if (isBot) return;
    setFrozenExpiry(getFrozenExpiry(currentUsername));
    setBanExpiry(getBanExpiry(currentUsername));
  }, [currentUsername, isBot]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Listen for BroadcastChannel updates
  useEffect(() => {
    const ch = new BroadcastChannel('globalchat_server_control');
    ch.onmessage = () => checkStatus();
    return () => ch.close();
  }, [checkStatus]);

  const handleSend = () => {
    if (!text.trim() || frozenExpiry || banExpiry || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const frozenMinsLeft = frozenExpiry
    ? Math.ceil((frozenExpiry - Date.now()) / 60_000)
    : 0;
  const banMinsLeft = banExpiry
    ? Math.ceil((banExpiry - Date.now()) / 60_000)
    : 0;

  const isBlocked = !!(frozenExpiry || banExpiry);

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      {banExpiry && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          🚫 You are banned for violating community guidelines.
          {banMinsLeft > 0 && ` (${banMinsLeft} minute${banMinsLeft !== 1 ? 's' : ''} remaining)`}
        </div>
      )}
      {frozenExpiry && !banExpiry && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs">
          🧊 You are frozen for {frozenMinsLeft} more minute{frozenMinsLeft !== 1 ? 's' : ''}.
        </div>
      )}
      <div className="flex items-end gap-2 bg-dc-input rounded-lg px-3 py-2 border border-white/10">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={isBlocked ? 'You cannot send messages right now...' : 'Message #general'}
          disabled={isBlocked || disabled}
          rows={1}
          className="flex-1 bg-transparent text-white text-sm placeholder-dc-muted resize-none outline-none min-h-[24px] max-h-[120px] leading-6 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSend}
          disabled={!text.trim() || isBlocked || disabled}
          className="h-8 w-8 shrink-0 text-dc-muted hover:text-white hover:bg-white/10 disabled:opacity-30"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
