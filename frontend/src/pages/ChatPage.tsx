import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ChatArea from '../components/ChatArea';
import MessageInputBar from '../components/MessageInputBar';
import AdminPanel from '../components/AdminPanel';
import ConfettiBurst from '../components/ConfettiBurst';
import BirthdayOverlay from '../components/BirthdayOverlay';
import TypingIndicatorBar from '../components/TypingIndicatorBar';
import { useBroadcastMessages } from '../hooks/useBroadcastMessages';
import { useAIMentionDetector } from '../hooks/useAIMentionDetector';
import { useChatModeration } from '../hooks/useChatModeration';
import type { ChatMessage } from '../types/chat';

interface Props {
  username: string;
  onLogout: () => void;
}

const FAKE_TYPERS = ['Alex', 'Jordan', 'Sam', 'Riley', 'Morgan'];

export default function ChatPage({ username, onLogout }: Props) {
  const { messages, sendMessage } = useBroadcastMessages();
  const [adminOpen, setAdminOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBirthday, setShowBirthday] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const confettiKeyRef = useRef(0);
  const birthdayKeyRef = useRef(0);

  const isOwner = username === 'AI.Caffeine';

  useAIMentionDetector(messages, sendMessage);
  useChatModeration(messages, sendMessage);

  // BroadcastChannel listener for fun effects
  useEffect(() => {
    const ch = new BroadcastChannel('globalchat_server_control');
    ch.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'confetti_blast') {
        confettiKeyRef.current += 1;
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }
      if (type === 'server_birthday' && !isOwner) {
        birthdayKeyRef.current += 1;
        setShowBirthday(true);
        setTimeout(() => setShowBirthday(false), 5500);
      }
      if (type === 'typing_flood') {
        const shuffled = [...FAKE_TYPERS].sort(() => Math.random() - 0.5).slice(0, 3);
        setTypingUsers(shuffled);
        setShowTyping(true);
      }
    };
    return () => ch.close();
  }, [isOwner]);

  const handleSend = useCallback(
    (text: string) => {
      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        username,
        text,
        timestamp: Date.now(),
        isBigMessage: false,
        isForced: false,
        isBot: false,
        isSystem: false,
        isBroadcast: false,
      };
      sendMessage(msg);
    },
    [username, sendMessage]
  );

  const handleAdminSend = useCallback(
    (text: string, isBig: boolean) => {
      const msg: ChatMessage = {
        id: `admin-${Date.now()}-${Math.random()}`,
        username: 'AI.Caffeine',
        text,
        timestamp: Date.now(),
        isBigMessage: isBig,
        isForced: false,
        isBot: false,
        isSystem: false,
        isBroadcast: true,
      };
      sendMessage(msg);
    },
    [sendMessage]
  );

  // Derive online users from recent messages
  const onlineUsers = Array.from(
    new Set(
      messages
        .slice(-50)
        .map((m) => m.username)
        .filter((u) => u !== 'G.AI 🤖')
    )
  ).slice(0, 20);

  if (!onlineUsers.includes(username)) onlineUsers.unshift(username);

  return (
    <div className="flex h-screen bg-dc-bg overflow-hidden relative">
      {/* Fun overlays */}
      {showConfetti && <ConfettiBurst key={confettiKeyRef.current} />}
      {showBirthday && <BirthdayOverlay key={birthdayKeyRef.current} />}

      <Sidebar
        currentUsername={username}
        onlineUsers={onlineUsers}
        onLogout={onLogout}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          channelName="general"
          onlineCount={onlineUsers.length}
          onLogout={onLogout}
          onAdminPanel={isOwner ? () => setAdminOpen(true) : undefined}
        />

        <ChatArea messages={messages} currentUsername={username} />

        {showTyping && (
          <TypingIndicatorBar
            usernames={typingUsers}
            onDone={() => setShowTyping(false)}
          />
        )}

        <MessageInputBar
          onSend={handleSend}
          currentUsername={username}
          disabled={false}
        />
      </div>

      {isOwner && (
        <AdminPanel
          open={adminOpen}
          onClose={() => setAdminOpen(false)}
          currentUsername={username}
          sendMessage={sendMessage}
          onAdminSend={handleAdminSend}
        />
      )}
    </div>
  );
}
