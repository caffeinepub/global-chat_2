import { useState, useEffect, useCallback, useRef } from "react";
import { getActiveSession } from "@/lib/auth";
import { useBroadcastMessages } from "@/hooks/useBroadcastMessages";
import { useServerState } from "@/hooks/useServerState";
import { useMuteManager } from "@/hooks/useMuteManager";
import { useBanManager } from "@/hooks/useBanManager";
import { useSlowMode } from "@/hooks/useSlowMode";
import { useChatLock } from "@/hooks/useChatLock";
import { useAIMentionDetector } from "@/hooks/useAIMentionDetector";
import { useChatModeration } from "@/hooks/useChatModeration";
import { getOpenAIKey } from "@/lib/openai";
import type { ChatMessage } from "@/types/chat";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ChatArea from "@/components/ChatArea";
import MessageInputBar from "@/components/MessageInputBar";
import AdminPanel from "@/components/AdminPanel";
import ShutdownOverlay from "@/components/ShutdownOverlay";
import StartupOverlay from "@/components/StartupOverlay";
import OwnerShutdownBanner from "@/components/OwnerShutdownBanner";
import ConfettiBurst from "@/components/ConfettiBurst";

const OWNER = "AI.Caffeine";

export default function ChatPage({ onLogout }: { onLogout: () => void }) {
  const session = getActiveSession();
  const username = session?.username || "Guest";

  const { messages, sendMessage } = useBroadcastMessages();
  const { isShutdown, shutdownMessage, shutdownUntil, showStartupOverlay } = useServerState();
  const { isUserMuted } = useMuteManager();
  const { isUserBanned } = useBanManager();
  const { isInCooldown } = useSlowMode();
  const { isChatLocked } = useChatLock();

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStartupOverlayLocal, setShowStartupOverlayLocal] = useState(false);
  const [apiKeyPrompt, setApiKeyPrompt] = useState(false);
  const [channelName, setChannelName] = useState("general");
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  // Online users tracking
  const [onlineUsers, setOnlineUsers] = useState<string[]>([username]);

  useEffect(() => {
    const stored: string[] = JSON.parse(localStorage.getItem("globalchat_online_users") || "[]");
    if (!stored.includes(username)) stored.push(username);
    localStorage.setItem("globalchat_online_users", JSON.stringify(stored));
    setOnlineUsers(stored);

    return () => {
      const current: string[] = JSON.parse(localStorage.getItem("globalchat_online_users") || "[]");
      const updated = current.filter(u => u !== username);
      localStorage.setItem("globalchat_online_users", JSON.stringify(updated));
    };
  }, [username]);

  // Listen for channel rename
  useEffect(() => {
    const stored = localStorage.getItem("globalchat_channel_name");
    if (stored) setChannelName(stored);

    const channel = new BroadcastChannel("globalchat_server_control");
    channel.onmessage = (event) => {
      const { type, name } = event.data || {};
      if (type === "rename_channel" && name) {
        setChannelName(name);
        localStorage.setItem("globalchat_channel_name", name);
      }
    };
    return () => channel.close();
  }, []);

  // Startup overlay from server state
  useEffect(() => {
    if (showStartupOverlay && username !== OWNER) {
      setShowStartupOverlayLocal(true);
    }
  }, [showStartupOverlay, username]);

  // Check for API key on mount (owner only)
  useEffect(() => {
    const key = getOpenAIKey();
    if (!key && username === OWNER) {
      setApiKeyPrompt(true);
    }
  }, [username]);

  const handleSend = useCallback((text: string) => {
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
  }, [username, sendMessage]);

  const handleAdminSend = useCallback((msg: ChatMessage) => {
    sendMessage(msg);
  }, [sendMessage]);

  const handleStartUp = useCallback(() => {
    const state = { isShutdown: false, shutdownUntil: 0, shutdownMessage: "" };
    localStorage.setItem("globalchat_server_state", JSON.stringify(state));
    try {
      const ch = new BroadcastChannel("globalchat_server_control");
      ch.postMessage({ type: "startup" });
      ch.close();
    } catch {}
  }, []);

  // AI mention detection — positional args
  useAIMentionDetector(messages, sendMessage);

  // Chat moderation — positional args
  useChatModeration(messages, sendMessage);

  const isOwner = username === OWNER;
  const isUserShutdownBlocked = isShutdown && !isOwner;

  // Suppress unused variable warnings for hooks used for side effects
  void isUserMuted;
  void isUserBanned;
  void isInCooldown;
  void isChatLocked;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1e1f22" }}>
      <Sidebar
        currentChannel={channelName}
        onlineUsers={onlineUsers}
        currentUsername={username}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#313338" }}>
        <TopBar
          channelName={channelName}
          onlineCount={onlineUsers.length}
          username={username}
          onOpenAdminPanel={() => setShowAdminPanel(true)}
          onLogout={onLogout}
        />

        {/* Owner shutdown banner */}
        {isShutdown && isOwner && (
          <OwnerShutdownBanner
            shutdownUntil={shutdownUntil}
            shutdownMessage={shutdownMessage}
            onStartUp={handleStartUp}
          />
        )}

        <ChatArea messages={messages} currentUsername={username} />

        <MessageInputBar
          onSend={handleSend}
          onEmojiPickerToggle={() => {}}
          username={username}
          disabled={isUserShutdownBlocked}
        />
      </div>

      {/* Overlays */}
      {isUserShutdownBlocked && (
        <ShutdownOverlay
          shutdownUntil={shutdownUntil}
          shutdownMessage={shutdownMessage}
        />
      )}

      {showStartupOverlayLocal && username !== OWNER && (
        <StartupOverlay onDone={() => setShowStartupOverlayLocal(false)} />
      )}

      {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}

      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onSendMessage={handleAdminSend}
          messages={messages}
        />
      )}

      {/* API Key Prompt for owner */}
      {apiKeyPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-lg p-6 max-w-sm w-full mx-4 border border-white/10" style={{ backgroundColor: "#2b2d31" }}>
            <h3 className="font-bold mb-2 text-white">OpenAI API Key Required</h3>
            <p className="text-sm mb-4" style={{ color: "#96989d" }}>
              To enable AI features (G.AI bot, chat moderation), please enter your OpenAI API key.
            </p>
            <input
              ref={apiKeyInputRef}
              type="password"
              placeholder="sk-..."
              className="w-full rounded px-3 py-2 text-sm text-white mb-3 focus:outline-none border border-white/10 focus:border-[#5865f2]"
              style={{ backgroundColor: "#1e1f22" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    localStorage.setItem("globalchat_openai_key", val);
                    setApiKeyPrompt(false);
                  }
                }
              }}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 text-white text-sm rounded transition-colors hover:opacity-90"
                style={{ backgroundColor: "#5865f2" }}
                onClick={() => {
                  const val = apiKeyInputRef.current?.value.trim();
                  if (val) {
                    localStorage.setItem("globalchat_openai_key", val);
                    setApiKeyPrompt(false);
                  }
                }}
              >
                Save Key
              </button>
              <button
                className="px-3 py-2 text-sm rounded transition-colors"
                style={{ color: "#96989d" }}
                onClick={() => setApiKeyPrompt(false)}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
