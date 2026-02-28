import { useState, useEffect } from "react";

interface ShutdownOverlayProps {
  shutdownUntil: number;
  shutdownMessage: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ShutdownOverlay({ shutdownUntil, shutdownMessage }: ShutdownOverlayProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, shutdownUntil - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, shutdownUntil - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [shutdownUntil]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
      <div className="text-center space-y-6 px-8 max-w-md">
        <div className="text-6xl">🔴</div>
        <h1 className="text-3xl font-bold text-white">Server Shut Down</h1>
        {shutdownMessage && (
          <p className="text-gray-300 text-lg">{shutdownMessage}</p>
        )}
        {shutdownUntil > 0 && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm uppercase tracking-widest">Estimated return in</p>
            <div className="text-5xl font-mono font-bold text-red-400">
              {formatCountdown(remaining)}
            </div>
          </div>
        )}
        <p className="text-gray-500 text-sm">Please wait while the server is being maintained.</p>
      </div>
    </div>
  );
}
