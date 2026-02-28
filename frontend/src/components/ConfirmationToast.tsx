import { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmationToastProps {
  message: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function ConfirmationToast({ message, onConfirm, onDismiss }: ConfirmationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-dc-sidebar border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[300px]">
        <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm text-dc-text flex-1">{message}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onConfirm}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2.5 py-1 rounded-lg transition-colors font-medium"
          >
            Confirm (C)
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-dc-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
