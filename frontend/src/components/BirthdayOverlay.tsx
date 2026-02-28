import { useEffect, useState } from 'react';

export default function BirthdayOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" />
      <div className="relative text-center animate-birthday-pop">
        <div className="text-8xl mb-4 animate-bounce">🎂</div>
        <h1 className="text-6xl font-black text-yellow-400 drop-shadow-lg mb-2 animate-pulse">
          Happy Birthday!
        </h1>
        <p className="text-3xl text-white drop-shadow-md">🎉 🎊 🎈 🥳 🎁</p>
      </div>
    </div>
  );
}
