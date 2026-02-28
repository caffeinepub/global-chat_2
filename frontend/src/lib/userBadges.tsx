import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const VERIFIED_OWNER_USERNAME = 'AI.Caffeine';

export function isVerifiedOwner(username: string): boolean {
  return username === VERIFIED_OWNER_USERNAME;
}

export function VerifiedOwnerBadge() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center ml-1 cursor-default">
            <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs font-semibold">
          Verified Owner
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
