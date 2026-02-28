interface StartupOverlayProps {
  visible: boolean;
}

export default function StartupOverlay({ visible }: StartupOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-green-600 flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Spinning loader */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-white animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🟢</span>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Server Starting Up...</h1>
          <p className="text-green-200 text-sm">Please wait while the server comes online.</p>
        </div>

        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-white/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
