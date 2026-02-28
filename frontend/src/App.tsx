import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import { getActiveSession, clearSession } from './lib/auth';

function checkSession(): boolean {
  try {
    const session = getActiveSession();
    return !!(session && session.isAuthenticated && session.username);
  } catch {
    return false;
  }
}

export default function App() {
  // Initialize synchronously from localStorage — no loading state needed
  // since localStorage reads are synchronous and instant.
  const [loggedIn, setLoggedIn] = useState<boolean>(() => checkSession());

  const handleJoin = () => {
    setLoggedIn(true);
  };

  const handleLogout = () => {
    try {
      clearSession();
    } catch {
      // ignore
    }
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LandingPage onJoin={handleJoin} />;
  }

  return <ChatPage onLogout={handleLogout} />;
}
