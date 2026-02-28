import { Pin, X } from "lucide-react";

interface PinnedMessageBarProps {
  message: {
    id: string;
    username: string;
    text: string;
  };
  onUnpin: () => void;
  isOwner: boolean;
}

export default function PinnedMessageBar({ message, onUnpin, isOwner }: PinnedMessageBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-discord-sidebar border-b border-discord-border">
      <Pin size={14} className="text-discord-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-discord-muted mr-1">📌 Pinned from</span>
        <span className="text-xs font-semibold text-discord-accent">{message.username}</span>
        <span className="text-xs text-discord-muted">: </span>
        <span className="text-xs text-discord-text truncate">{message.text}</span>
      </div>
      {isOwner && (
        <button
          onClick={onUnpin}
          className="text-discord-muted hover:text-discord-text transition-colors shrink-0"
          title="Unpin message"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
