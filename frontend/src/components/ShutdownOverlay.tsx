import { formatCountdown } from '../lib/serverState';

interface ShutdownOverlayProps {
  shutdownMessage: string;
  remainingMs: number;
}

export default function ShutdownOverlay({ shutdownMessage, remainingMs }: ShutdownOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-6 max-w-md px-8 text-center">
        {/* Pulsing red dot */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-600/40 flex items-center justify-center animate-pulse">
              <div className="w-6 h-6 rounded-full bg-red-500" />
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-red-400 mb-2">🔴 Server Shut Down</h1>
          <p className="text-gray-400 text-sm">The server is temporarily offline.</p>
        </div>

        {shutdownMessage && (
          <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 w-full">
            <p className="text-gray-300 text-sm italic">"{shutdownMessage}"</p>
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Time remaining</p>
          <div className="text-5xl font-mono font-bold text-white tabular-nums">
            {formatCountdown(remainingMs)}
          </div>
        </div>

        <p className="text-gray-600 text-xs">
          The server will automatically come back online when the timer reaches 00:00.
        </p>
      </div>
    </div>
  );
}
