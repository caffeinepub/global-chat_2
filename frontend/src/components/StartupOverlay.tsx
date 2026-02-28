import { useEffect, useState } from "react";

interface StartupOverlayProps {
  onDone: () => void;
}

export default function StartupOverlay({ onDone }: StartupOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-900/95">
      <div className="text-center space-y-6 px-8">
        <div className="text-6xl">🟢</div>
        <h1 className="text-3xl font-bold text-white">Server Starting Up...</h1>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <p className="text-green-200 text-sm">The server is coming back online. Please wait...</p>
      </div>
    </div>
  );
}
