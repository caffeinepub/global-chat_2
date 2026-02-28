import { X, Megaphone } from "lucide-react";

interface MOTDBannerProps {
  motd: string;
  onDismiss: () => void;
}

export default function MOTDBanner({ motd, onDismiss }: MOTDBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-900/60 border-b border-blue-700">
      <Megaphone size={16} className="text-blue-300 shrink-0" />
      <p className="flex-1 text-blue-200 text-sm">{motd}</p>
      <button
        onClick={onDismiss}
        className="text-blue-400 hover:text-blue-200 transition-colors shrink-0"
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
