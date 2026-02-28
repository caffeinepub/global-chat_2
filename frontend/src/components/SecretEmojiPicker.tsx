import { useEffect, useRef, RefObject } from 'react';
import { Sparkles } from 'lucide-react';

interface SecretEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

const SECRET_EMOJIS = [
  '🌈', '🦄', '🔮', '🌙', '⭐', '💫', '✨', '🎭',
  '🎪', '🎨', '🎯', '🎲', '🃏', '🎰', '🎸', '🎺',
  '🦋', '🐉', '🦊', '🦝', '🦩', '🦚', '🦜', '🐙',
  '🌺', '🌸', '🌻', '🍄', '🌵', '🎋', '🎍', '🌊',
  '🔥', '💎', '👑', '🗝️', '⚡', '🌀', '🎆', '🎇',
  '🍕', '🌮', '🍜', '🧁', '🍩', '🍦', '🧃', '🫧',
  '🚀', '🛸', '🌍', '🪐', '☄️', '🌌', '🔭', '🛰️',
  '🎃', '👻', '💀', '🤖', '👾', '🎮', '🕹️', '🧩',
  '🫀', '🧠', '👁️', '🫶', '🤌', '🤙', '🫵', '✌️',
  '🌝', '🌚', '🌞', '🌛', '🌜', '🌟', '💥', '🎑',
];

export default function SecretEmojiPicker({ onSelect, onClose }: SecretEmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 w-80 bg-dc-sidebar rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-dc-bg/30">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-semibold text-white">Secret Emoji Vault</span>
        <span className="ml-auto text-xs text-dc-muted">Ctrl+Alt to toggle</span>
      </div>

      {/* Emoji grid */}
      <div className="p-3 grid grid-cols-10 gap-1 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {SECRET_EMOJIS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-dc-chat hover:scale-125 active:scale-95 transition-all"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-white/5 bg-dc-bg/20">
        <p className="text-[10px] text-dc-muted text-center">
          🤫 Shhh... these are secret! Press <kbd className="bg-dc-chat px-1 rounded">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
