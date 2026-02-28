import { Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCountdown } from '../lib/serverState';

interface OwnerShutdownBannerProps {
  remainingMs: number;
  shutdownMessage: string;
  onStartup: () => void;
}

export default function OwnerShutdownBanner({ remainingMs, shutdownMessage, onStartup }: OwnerShutdownBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 shrink-0">
      <span className="text-amber-400 text-lg shrink-0">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-amber-300 text-sm font-semibold">
          Server is shut down —{' '}
          <span className="font-mono tabular-nums">{formatCountdown(remainingMs)}</span>{' '}
          remaining
        </p>
        {shutdownMessage && (
          <p className="text-amber-400/70 text-xs truncate">"{shutdownMessage}"</p>
        )}
      </div>
      <Button
        size="sm"
        onClick={onStartup}
        className="h-7 px-3 text-xs bg-green-600 hover:bg-green-500 text-white border-0 shrink-0 gap-1.5"
      >
        <Power className="w-3 h-3" />
        Start Up Now
      </Button>
    </div>
  );
}
