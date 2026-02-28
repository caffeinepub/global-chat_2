import { useState, useRef, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ChatArea from '../components/ChatArea';
import MessageInputBar from '../components/MessageInputBar';
import AIChatButton from '../components/AIChatButton';
import AIChatPanel from '../components/AIChatPanel';
import SecretEmojiPicker from '../components/SecretEmojiPicker';
import ConfirmationToast from '../components/ConfirmationToast';
import AdminPanel from '../components/AdminPanel';
import ShutdownOverlay from '../components/ShutdownOverlay';
import StartupOverlay from '../components/StartupOverlay';
import { useBroadcastMessages } from '../hooks/useBroadcastMessages';
import { useEmojiPickerShortcut } from '../hooks/useEmojiPickerShortcut';
import { useClearChatShortcut } from '../hooks/useClearChatShortcut';
import { useAIMentionDetector } from '../hooks/useAIMentionDetector';
import { useChatModeration } from '../hooks/useChatModeration';
import { useServerState } from '../hooks/useServerState';
import { isVerifiedOwner } from '../lib/userBadges';
import { ChatMessage } from '../types/chat';

interface ChatPageProps {
  username: string;
  onLogout: () => void;
}

export default function ChatPage({ username, onLogout }: ChatPageProps) {
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const isAdmin = isVerifiedOwner(username);

  const { messages, sendMessage, clearMessages } = useBroadcastMessages(username);
  const { showEmojiPicker, setShowEmojiPicker } = useEmojiPickerShortcut();
  const { showClearToast, confirmClear, dismissClear } = useClearChatShortcut(
    chatAreaRef,
    clearMessages
  );

  // Server state — used to show shutdown/startup overlays for non-owner users
  const {
    isShutdown,
    shutdownMessage,
    remainingMs,
    showStartupOverlay,
  } = useServerState();

  // Non-owner users see overlays; AI.Caffeine never sees them
  const showShutdownOverlay = !isAdmin && isShutdown && remainingMs > 0;
  const showStartup = !isAdmin && showStartupOverlay;

  useAIMentionDetector(messages, sendMessage);
  useChatModeration(messages, sendMessage);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    sendMessage(text.trim());
  }, [sendMessage]);

  const handleAdminSend = useCallback((
    text: string,
    overrideUsername?: string,
    isBot?: boolean,
    extras?: Partial<Pick<ChatMessage, 'isBigMessage' | 'isForced'>>
  ) => {
    sendMessage(text, overrideUsername, isBot, extras);
  }, [sendMessage]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    if (inputRef.current) {
      const el = inputRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + emoji + el.value.slice(end);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(el, newVal);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      requestAnimationFrame(() => {
        el.selectionStart = start + emoji.length;
        el.selectionEnd = start + emoji.length;
        el.focus();
      });
    }
    setShowEmojiPicker(false);
  }, [setShowEmojiPicker]);

  // Close sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-dc-bg overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 md:z-auto h-full
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar username={username} onLeave={onLogout} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          username={username}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          onAdminPanel={isAdmin ? () => setAdminPanelOpen(true) : undefined}
        />

        <div
          ref={chatAreaRef}
          className="flex-1 overflow-hidden flex flex-col min-h-0"
          tabIndex={0}
          style={{ outline: 'none' }}
        >
          <ChatArea messages={messages} currentUsername={username} />
        </div>

        <MessageInputBar
          ref={inputRef}
          onSend={handleSend}
          username={username}
        />
      </div>

      {/* Secret Emoji Picker */}
      {showEmojiPicker && (
        <SecretEmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          inputRef={inputRef}
        />
      )}

      {/* Clear Chat Toast */}
      {showClearToast && (
        <ConfirmationToast
          message="Clear your chat view? Press C again to confirm"
          onConfirm={confirmClear}
          onDismiss={dismissClear}
        />
      )}

      {/* AI Chat */}
      <AIChatButton onClick={() => setAiPanelOpen(true)} isOpen={aiPanelOpen} />
      {aiPanelOpen && (
        <AIChatPanel username={username} onClose={() => setAiPanelOpen(false)} />
      )}

      {/* Admin Panel (only for AI.Caffeine) */}
      {isAdmin && (
        <AdminPanel
          open={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
          onSendMessage={handleAdminSend}
        />
      )}

      {/* ── Shutdown Overlay (non-owner users only) ── */}
      {showShutdownOverlay && (
        <ShutdownOverlay
          shutdownMessage={shutdownMessage}
          remainingMs={remainingMs}
        />
      )}

      {/* ── Startup Overlay (non-owner users only, 5 seconds) ── */}
      <StartupOverlay visible={showStartup} />

      {/* Footer attribution */}
      <div className="hidden">
        Built with love using{' '}
        <a href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'global-chat')}`}>
          caffeine.ai
        </a>
        © {new Date().getFullYear()}
      </div>
    </div>
  );
}
