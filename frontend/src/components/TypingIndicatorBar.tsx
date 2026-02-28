import { useEffect, useState } from 'react';

interface Props {
  usernames: string[];
  onDone: () => void;
}

export default function TypingIndicatorBar({ usernames, onDone }: Props) {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'));
    }, 400);
    const doneTimer = setTimeout(onDone, 5000);
    return () => {
      clearInterval(dotInterval);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const names = usernames.join(', ');
  const verb = usernames.length === 1 ? 'is' : 'are';

  return (
    <div className="px-4 py-1 text-xs text-dc-muted flex items-center gap-1 bg-dc-chat border-t border-white/5">
      <span className="flex gap-0.5 mr-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-1.5 h-1.5 rounded-full bg-dc-muted animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>
        <strong>{names}</strong> {verb} typing{dots}
      </span>
    </div>
  );
}
