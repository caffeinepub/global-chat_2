import { useState, forwardRef, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import { Send, ShieldAlert, VolumeX, Lock, Clock, Server } from 'lucide-react';
import { useBanManager } from '../hooks/useBanManager';
import { useMuteManager } from '../hooks/useMuteManager';
import { useServerState } from '../hooks/useServerState';
import { useSlowMode } from '../hooks/useSlowMode';
import { useChatLock } from '../hooks/useChatLock';
import { useShadowban } from '../hooks/useShadowban';

interface MessageInputBarProps {
  onSend: (text: string, isShadowbanned?: boolean) => void;
  username: string;
}

const BOT_USERNAME = 'G.AI 🤖';
const OWNER_USERNAME = 'AI.Caffeine';

const MessageInputBar = forwardRef<HTMLTextAreaElement, MessageInputBarProps>(
  ({ onSend, username }, ref) => {
    const [value, setValue] = useState('');
    const [remainingBanMs, setRemainingBanMs] = useState(0);
    const [remainingMuteMs, setRemainingMuteMs] = useState(0);
    const { getRemainingBanMs } = useBanManager();
    const { getRemainingMuteMs } = useMuteManager();

    const isOwner = username === OWNER_USERNAME;
    const isBot = username === BOT_USERNAME;
    const bypassRestrictions = isOwner || isBot;

    const { isShutdown } = useServerState();
    const { isChatLocked } = useChatLock();
    const { isSlowModeActive, canSend, remainingCooldown, recordSend } = useSlowMode(username);
    const { isShadowbanned } = useShadowban(username);

    // Poll ban and mute status every second
    useEffect(() => {
      if (bypassRestrictions) return;
      const update = () => {
        setRemainingBanMs(getRemainingBanMs(username));
        setRemainingMuteMs(getRemainingMuteMs(username));
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }, [username, getRemainingBanMs, getRemainingMuteMs, bypassRestrictions]);

    const isBanned = !bypassRestrictions && remainingBanMs > 0;
    const isMuted = !bypassRestrictions && remainingMuteMs > 0;
    const isServerDown = !bypassRestrictions && isShutdown;
    const isChatLockedForUser = !bypassRestrictions && isChatLocked;
    const isSlowBlocked = !bypassRestrictions && isSlowModeActive && !canSend;

    const isBlocked = isBanned || isMuted || isServerDown || isChatLockedForUser || isSlowBlocked;

    const banRemainingMinutes = Math.ceil(remainingBanMs / 60000);
    const banRemainingSeconds = Math.ceil(remainingBanMs / 1000);
    const muteRemainingMinutes = Math.ceil(remainingMuteMs / 60000);
    const muteRemainingSeconds = Math.ceil(remainingMuteMs / 1000);

    const handleSend = () => {
      if (!value.trim() || isBlocked) return;
      onSend(value.trim(), isShadowbanned);
      if (isSlowModeActive && !bypassRestrictions) {
        recordSend();
      }
      setValue('');
      if (ref && 'current' in ref && ref.current) {
        ref.current.style.height = 'auto';
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    };

    const getBorderClass = () => {
      if (isBanned) return 'border-red-500/30 opacity-60';
      if (isMuted) return 'border-orange-500/30 opacity-60';
      if (isServerDown) return 'border-gray-600/30 opacity-50';
      if (isChatLockedForUser) return 'border-yellow-500/30 opacity-60';
      if (isSlowBlocked) return 'border-blue-500/30 opacity-60';
      return 'border-white/5 focus-within:border-dc-accent/30';
    };

    const getPlaceholder = () => {
      if (isBanned) return 'You are temporarily banned from sending messages...';
      if (isMuted) return 'You are muted and cannot send messages...';
      if (isServerDown) return 'Server is currently shut down...';
      if (isChatLockedForUser) return 'Chat is locked by admin...';
      if (isSlowBlocked) return `Please wait ${remainingCooldown}s before sending again...`;
      return `Message #global as ${username}...`;
    };

    return (
      <div className="px-4 pb-4 pt-2 bg-dc-chat shrink-0">
        {/* Warning banners */}
        {isBanned && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-400">
              You are banned for{' '}
              <span className="font-semibold">
                {banRemainingMinutes > 1 ? `${banRemainingMinutes} minutes` : `${banRemainingSeconds} seconds`}
              </span>{' '}
              due to a violation.
            </p>
          </div>
        )}
        {!isBanned && isMuted && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <VolumeX className="w-4 h-4 text-orange-400 shrink-0" />
            <p className="text-xs text-orange-400">
              You are muted for{' '}
              <span className="font-semibold">
                {muteRemainingMinutes > 1 ? `${muteRemainingMinutes} minutes` : `${muteRemainingSeconds} seconds`}
              </span>
              . You cannot send messages right now.
            </p>
          </div>
        )}
        {!isBanned && !isMuted && isServerDown && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-500/10 border border-gray-500/30 rounded-xl">
            <Server className="w-4 h-4 text-gray-400 shrink-0" />
            <p className="text-xs text-gray-400">
              Server is currently shut down. Please wait for it to come back online.
            </p>
          </div>
        )}
        {!isBanned && !isMuted && !isServerDown && isChatLockedForUser && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <Lock className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-400">
              Chat is locked by admin. Only admins can send messages.
            </p>
          </div>
        )}
        {!isBanned && !isMuted && !isServerDown && !isChatLockedForUser && isSlowBlocked && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-400">
              Slow mode is active. Please wait{' '}
              <span className="font-semibold">{remainingCooldown} second{remainingCooldown !== 1 ? 's' : ''}</span>{' '}
              before sending again.
            </p>
          </div>
        )}

        <div className={`flex items-end gap-2 bg-dc-input rounded-xl px-4 py-2 border transition-colors ${getBorderClass()}`}>
          <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isBlocked}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder:text-dc-muted text-sm resize-none focus:outline-none leading-relaxed py-1.5 max-h-[120px] overflow-y-auto disabled:cursor-not-allowed"
            style={{ scrollbarWidth: 'none' }}
          />
          <div className="flex items-center gap-1 pb-1 shrink-0">
            <button
              onClick={handleSend}
              disabled={!value.trim() || isBlocked}
              className="p-1.5 rounded-lg bg-dc-accent hover:bg-dc-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all duration-150 hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-dc-muted mt-1.5 px-1">
          Press <kbd className="bg-dc-input px-1 py-0.5 rounded text-[9px]">Enter</kbd> to send ·{' '}
          <kbd className="bg-dc-input px-1 py-0.5 rounded text-[9px]">Shift+Enter</kbd> for new line ·{' '}
          <kbd className="bg-dc-input px-1 py-0.5 rounded text-[9px]">Ctrl+Alt</kbd> for emoji
        </p>
      </div>
    );
  }
);

MessageInputBar.displayName = 'MessageInputBar';

export default MessageInputBar;
