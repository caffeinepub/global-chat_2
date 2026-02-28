import { Bot, X } from 'lucide-react';

interface AIChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function AIChatButton({ onClick, isOpen }: AIChatButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-dc-accent hover:bg-dc-accent-hover text-white px-4 py-3 rounded-2xl shadow-xl shadow-dc-accent/30 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-dc-accent/50"
    >
      <Bot className="w-5 h-5" />
      <span className="text-sm font-semibold">G.AI Chat</span>
    </button>
  );
}
