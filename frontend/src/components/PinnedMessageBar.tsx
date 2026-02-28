import { Pin, X } from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface PinnedMessageBarProps {
  messageId: string;
  messages: ChatMessage[];
  onDismiss?: () => void;
}

export default function PinnedMessageBar({ messageId, messages, onDismiss }: PinnedMessageBarProps) {
  const message = messages.find(m => m.id === messageId);
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-dc-accent/10 border-b border-dc-accent/20 shrink-0">
      <Pin className="w-3.5 h-3.5 text-dc-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-dc-accent text-xs font-semibold mr-1.5">📌 Pinned</span>
        <span className="text-dc-text-secondary text-xs font-medium mr-1">{message.username}:</span>
        <span className="text-dc-text text-xs truncate">{message.text}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-dc-muted hover:text-white transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
