import { useState, useEffect } from "react";

interface OwnerShutdownBannerProps {
  shutdownUntil: number;
  shutdownMessage: string;
  onStartUp: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function OwnerShutdownBanner({ shutdownUntil, shutdownMessage, onStartUp }: OwnerShutdownBannerProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, shutdownUntil - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, shutdownUntil - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [shutdownUntil]);

  return (
    <div className="bg-red-900/80 border-b border-red-700 px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-red-300 font-semibold text-sm">🔴 Server is shut down</span>
        {shutdownMessage && (
          <span className="text-red-200 text-sm">— {shutdownMessage}</span>
        )}
        {shutdownUntil > 0 && (
          <span className="text-red-300 font-mono text-sm">({formatCountdown(remaining)} remaining)</span>
        )}
      </div>
      <button
        onClick={onStartUp}
        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-colors"
      >
        Start Up Now
      </button>
    </div>
  );
}
