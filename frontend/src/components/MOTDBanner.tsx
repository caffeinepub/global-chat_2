import { X, Megaphone } from 'lucide-react';

interface MOTDBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function MOTDBanner({ message, onDismiss }: MOTDBannerProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 bg-blue-500/10 border-b border-blue-500/20 shrink-0">
      <Megaphone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-blue-300 text-xs font-bold uppercase tracking-wide mr-2">MOTD</span>
        <span className="text-blue-200 text-xs">{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="text-blue-400/60 hover:text-blue-300 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
