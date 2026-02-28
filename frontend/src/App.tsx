import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import { getActiveSession, clearSession } from './lib/auth';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getActiveSession();
    if (session) {
      setUsername(session.username);
    }
    setIsLoading(false);
  }, []);

  const handleJoin = (name: string) => {
    setUsername(name);
  };

  const handleLogout = () => {
    clearSession();
    setUsername(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dc-bg">
        <div className="w-8 h-8 border-2 border-dc-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!username) {
    return <LandingPage onJoin={handleJoin} />;
  }

  return <ChatPage username={username} onLogout={handleLogout} />;
}
