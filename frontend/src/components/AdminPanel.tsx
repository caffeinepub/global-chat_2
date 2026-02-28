import { useState } from "react";
import { X, Shield, Ban, Volume2, VolumeX, Server, Lock, Unlock, MessageSquare, Megaphone, Users, Pin, Star, AlertTriangle, Hash, UserX, FileText, ChevronDown } from "lucide-react";
import { useMuteManager } from "@/hooks/useMuteManager";
import { useBanManager } from "@/hooks/useBanManager";
import { addModLogEntry } from "@/lib/modLog";
import type { ChatMessage } from "@/types/chat";

interface AdminPanelProps {
  onClose: () => void;
  onSendMessage: (msg: ChatMessage) => void;
  messages: ChatMessage[];
}

const OWNER = "AI.Caffeine";

export default function AdminPanel({ onClose, onSendMessage, messages }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"moderation" | "server" | "chat" | "message" | "more">("moderation");
  const [targetUser, setTargetUser] = useState("");
  const [banDuration, setBanDuration] = useState("10");
  const [muteDuration, setMuteDuration] = useState("10");
  const [slowModeSeconds, setSlowModeSeconds] = useState("5");
  const [shutdownDuration, setShutdownDuration] = useState("30");
  const [shutdownMessage, setShutdownMessage] = useState("");
  const [bigMessageText, setBigMessageText] = useState("");
  const [forceText, setForceText] = useState("");
  const [forceTarget, setForceTarget] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // More Commands state
  const [renameUser, setRenameUser] = useState("");
  const [renameNewName, setRenameNewName] = useState("");
  const [pinMessageId, setPinMessageId] = useState("");
  const [announceRole, setAnnounceRole] = useState("");
  const [announceUser, setAnnounceUser] = useState("");
  const [fakeJoinUser, setFakeJoinUser] = useState("");
  const [fakeLeaveUser, setFakeLeaveUser] = useState("");
  const [motdText, setMotdText] = useState("");
  const [highlightUser, setHighlightUser] = useState("");
  const [highlightColor, setHighlightColor] = useState("#ff6b6b");
  const [shadowbanUser, setShadowbanUser] = useState("");
  const [unshadowbanUser, setUnshadowbanUser] = useState("");
  const [renameChannel, setRenameChannel] = useState("");
  const [userLimit, setUserLimit] = useState("50");
  const [impersonateText, setImpersonateText] = useState("");
  const [exportFormat, setExportFormat] = useState("txt");

  const { muteUser, unmuteUser } = useMuteManager();
  const { banUser, unbanUser } = useBanManager();

  const broadcast = (type: string, payload: Record<string, unknown> = {}) => {
    try {
      const ch = new BroadcastChannel("globalchat_server_control");
      ch.postMessage({ type, ...payload });
      ch.close();
    } catch {}
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  // --- MODERATION COMMANDS ---
  const handleBan = () => {
    if (!targetUser.trim()) return;
    const mins = parseInt(banDuration) || 10;
    banUser(targetUser.trim(), mins);
    broadcast("ban", { username: targetUser.trim(), durationMinutes: mins });
    addModLogEntry({ username: targetUser.trim(), message: "", timestamp: Date.now(), reason: `Banned for ${mins} minutes` });
    showStatus(`✅ Banned ${targetUser.trim()} for ${mins} minutes`);
  };

  const handleUnban = () => {
    if (!targetUser.trim()) return;
    unbanUser(targetUser.trim());
    broadcast("unban", { username: targetUser.trim() });
    addModLogEntry({ username: targetUser.trim(), message: "", timestamp: Date.now(), reason: "Unbanned" });
    showStatus(`✅ Unbanned ${targetUser.trim()}`);
  };

  const handleMute = () => {
    if (!targetUser.trim()) return;
    const mins = parseInt(muteDuration) || 10;
    muteUser(targetUser.trim(), mins);
    broadcast("mute", { username: targetUser.trim(), durationMinutes: mins });
    addModLogEntry({ username: targetUser.trim(), message: "", timestamp: Date.now(), reason: `Muted for ${mins} minutes` });
    showStatus(`✅ Muted ${targetUser.trim()} for ${mins} minutes`);
  };

  const handleUnmute = () => {
    if (!targetUser.trim()) return;
    unmuteUser(targetUser.trim());
    broadcast("unmute", { username: targetUser.trim() });
    addModLogEntry({ username: targetUser.trim(), message: "", timestamp: Date.now(), reason: "Unmuted" });
    showStatus(`✅ Unmuted ${targetUser.trim()}`);
  };

  const handleMassMute = () => {
    const onlineUsers = getOnlineUsers();
    onlineUsers.forEach(u => {
      if (u !== OWNER) {
        muteUser(u, 60);
        broadcast("mute", { username: u, durationMinutes: 60 });
      }
    });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Mass muted ${onlineUsers.filter(u => u !== OWNER).length} users for 60 minutes` });
    showStatus(`✅ Mass muted ${onlineUsers.filter(u => u !== OWNER).length} users`);
  };

  const handleMassUnmute = () => {
    const onlineUsers = getOnlineUsers();
    onlineUsers.forEach(u => {
      if (u !== OWNER) {
        unmuteUser(u);
        broadcast("unmute", { username: u });
      }
    });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Mass unmuted all users" });
    showStatus(`✅ Mass unmuted all users`);
  };

  // --- SERVER COMMANDS ---
  const handleShutdown = () => {
    const mins = parseInt(shutdownDuration) || 30;
    const shutdownUntil = Date.now() + mins * 60 * 1000;
    const state = { isShutdown: true, shutdownUntil, shutdownMessage: shutdownMessage.trim() || "The server is temporarily offline." };
    localStorage.setItem("globalchat_server_state", JSON.stringify(state));
    broadcast("shutdown", { shutdownUntil, shutdownMessage: state.shutdownMessage });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Server shutdown for ${mins} minutes` });
    showStatus(`✅ Server shut down for ${mins} minutes`);
  };

  const handleStartup = () => {
    const state = { isShutdown: false, shutdownUntil: 0, shutdownMessage: "" };
    localStorage.setItem("globalchat_server_state", JSON.stringify(state));
    broadcast("startup", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Server started up" });
    showStatus(`✅ Server started up`);
  };

  // --- CHAT COMMANDS ---
  const handleSlowMode = () => {
    const secs = parseInt(slowModeSeconds) || 5;
    localStorage.setItem("globalchat_slowmode", JSON.stringify({ enabled: true, seconds: secs }));
    broadcast("slowmode", { enabled: true, seconds: secs });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Slow mode enabled: ${secs}s` });
    showStatus(`✅ Slow mode enabled (${secs}s)`);
  };

  const handleDisableSlowMode = () => {
    localStorage.setItem("globalchat_slowmode", JSON.stringify({ enabled: false, seconds: 0 }));
    broadcast("slowmode", { enabled: false, seconds: 0 });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Slow mode disabled" });
    showStatus(`✅ Slow mode disabled`);
  };

  const handleLockChat = () => {
    localStorage.setItem("globalchat_locked", "true");
    broadcast("lock_chat", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Chat locked" });
    showStatus(`✅ Chat locked`);
  };

  const handleUnlockChat = () => {
    localStorage.setItem("globalchat_locked", "false");
    broadcast("unlock_chat", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Chat unlocked" });
    showStatus(`✅ Chat unlocked`);
  };

  // --- MESSAGE COMMANDS ---
  const handleBigMessage = () => {
    if (!bigMessageText.trim()) return;
    const msg: ChatMessage = {
      id: `admin-big-${Date.now()}`,
      username: OWNER,
      text: bigMessageText.trim(),
      timestamp: Date.now(),
      isBigMessage: true,
      isForced: false,
      isBot: false,
      isSystem: false,
      isBroadcast: false,
    };
    onSendMessage(msg);
    setBigMessageText("");
    showStatus("✅ Big message sent");
  };

  const handleForceText = () => {
    if (!forceText.trim() || !forceTarget.trim()) return;
    const msg: ChatMessage = {
      id: `admin-force-${Date.now()}`,
      username: forceTarget.trim(),
      text: forceText.trim(),
      timestamp: Date.now(),
      isBigMessage: false,
      isForced: true,
      isBot: false,
      isSystem: false,
      isBroadcast: false,
    };
    onSendMessage(msg);
    setForceText("");
    setForceTarget("");
    showStatus("✅ Force text sent");
  };

  // --- MORE COMMANDS ---
  const handleRenameUser = () => {
    if (!renameUser.trim() || !renameNewName.trim()) return;
    broadcast("rename_user", { oldName: renameUser.trim(), newName: renameNewName.trim() });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Renamed ${renameUser.trim()} to ${renameNewName.trim()}` });
    showStatus(`✅ Renamed ${renameUser.trim()} to ${renameNewName.trim()}`);
    setRenameUser(""); setRenameNewName("");
  };

  const handleClearAllChat = () => {
    broadcast("clear_chat", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Cleared all chat" });
    showStatus("✅ Chat cleared");
  };

  const handlePinMessage = () => {
    if (!pinMessageId.trim()) return;
    const msg = messages.find(m => m.id === pinMessageId.trim() || m.text.toLowerCase().includes(pinMessageId.trim().toLowerCase()));
    if (!msg) { showStatus("❌ Message not found"); return; }
    const pinData = { id: msg.id, username: msg.username, text: msg.text };
    localStorage.setItem("globalchat_pinned", JSON.stringify(pinData));
    broadcast("pin_message", pinData);
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Pinned message from ${msg.username}` });
    showStatus("✅ Message pinned");
    setPinMessageId("");
  };

  const handleUnpinMessage = () => {
    localStorage.removeItem("globalchat_pinned");
    broadcast("unpin_message", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Unpinned message" });
    showStatus("✅ Message unpinned");
  };

  const handleAnnounceRole = () => {
    if (!announceUser.trim() || !announceRole.trim()) return;
    const msg: ChatMessage = {
      id: `system-${Date.now()}`,
      username: "System",
      text: `📣 ${announceUser.trim()} has been given the role: ${announceRole.trim()}`,
      timestamp: Date.now(),
      isBigMessage: false,
      isForced: false,
      isBot: false,
      isSystem: true,
      isBroadcast: false,
    };
    onSendMessage(msg);
    setAnnounceUser(""); setAnnounceRole("");
    showStatus("✅ Role announced");
  };

  const handleChangeTheme = (theme: string) => {
    localStorage.setItem("globalchat_theme", theme);
    broadcast("change_theme", { theme });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Changed theme to ${theme}` });
    showStatus(`✅ Theme changed to ${theme}`);
  };

  const handleFakeJoin = () => {
    if (!fakeJoinUser.trim()) return;
    const msg: ChatMessage = {
      id: `system-${Date.now()}`,
      username: "System",
      text: `👋 ${fakeJoinUser.trim()} joined the server`,
      timestamp: Date.now(),
      isBigMessage: false,
      isForced: false,
      isBot: false,
      isSystem: true,
      isBroadcast: false,
    };
    onSendMessage(msg);
    setFakeJoinUser("");
    showStatus("✅ Fake join sent");
  };

  const handleFakeLeave = () => {
    if (!fakeLeaveUser.trim()) return;
    const msg: ChatMessage = {
      id: `system-${Date.now()}`,
      username: "System",
      text: `👋 ${fakeLeaveUser.trim()} left the server`,
      timestamp: Date.now(),
      isBigMessage: false,
      isForced: false,
      isBot: false,
      isSystem: true,
      isBroadcast: false,
    };
    onSendMessage(msg);
    setFakeLeaveUser("");
    showStatus("✅ Fake leave sent");
  };

  const handleSetMOTD = () => {
    if (!motdText.trim()) return;
    localStorage.setItem("globalchat_motd", motdText.trim());
    broadcast("set_motd", { motd: motdText.trim() });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Set MOTD: ${motdText.trim()}` });
    showStatus("✅ MOTD set");
    setMotdText("");
  };

  const handleClearMOTD = () => {
    localStorage.removeItem("globalchat_motd");
    broadcast("clear_motd", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Cleared MOTD" });
    showStatus("✅ MOTD cleared");
  };

  const handleHighlightUser = () => {
    if (!highlightUser.trim()) return;
    const highlights = JSON.parse(localStorage.getItem("globalchat_highlights") || "{}");
    highlights[highlightUser.trim()] = highlightColor;
    localStorage.setItem("globalchat_highlights", JSON.stringify(highlights));
    broadcast("highlight_user", { username: highlightUser.trim(), color: highlightColor });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Highlighted ${highlightUser.trim()}` });
    showStatus(`✅ Highlighted ${highlightUser.trim()}`);
    setHighlightUser("");
  };

  const handleShadowban = () => {
    if (!shadowbanUser.trim()) return;
    const shadowbans: string[] = JSON.parse(localStorage.getItem("globalchat_shadowbans") || "[]");
    if (!shadowbans.includes(shadowbanUser.trim())) shadowbans.push(shadowbanUser.trim());
    localStorage.setItem("globalchat_shadowbans", JSON.stringify(shadowbans));
    broadcast("shadowban", { username: shadowbanUser.trim() });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Shadowbanned ${shadowbanUser.trim()}` });
    showStatus(`✅ Shadowbanned ${shadowbanUser.trim()}`);
    setShadowbanUser("");
  };

  const handleUnshadowban = () => {
    if (!unshadowbanUser.trim()) return;
    const shadowbans: string[] = JSON.parse(localStorage.getItem("globalchat_shadowbans") || "[]");
    const updated = shadowbans.filter((u: string) => u !== unshadowbanUser.trim());
    localStorage.setItem("globalchat_shadowbans", JSON.stringify(updated));
    broadcast("unshadowban", { username: unshadowbanUser.trim() });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Unshadowbanned ${unshadowbanUser.trim()}` });
    showStatus(`✅ Unshadowbanned ${unshadowbanUser.trim()}`);
    setUnshadowbanUser("");
  };

  const handleRenameChannel = () => {
    if (!renameChannel.trim()) return;
    localStorage.setItem("globalchat_channel_name", renameChannel.trim());
    broadcast("rename_channel", { name: renameChannel.trim() });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Renamed channel to ${renameChannel.trim()}` });
    showStatus(`✅ Channel renamed to ${renameChannel.trim()}`);
    setRenameChannel("");
  };

  const handleSetUserLimit = () => {
    const limit = parseInt(userLimit) || 50;
    localStorage.setItem("globalchat_user_limit", String(limit));
    broadcast("set_user_limit", { limit });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Set user limit to ${limit}` });
    showStatus(`✅ User limit set to ${limit}`);
  };

  const handleResetUserLimit = () => {
    localStorage.removeItem("globalchat_user_limit");
    broadcast("reset_user_limit", {});
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: "Reset user limit" });
    showStatus("✅ User limit reset");
  };

  const handleToggleProfanityFilter = () => {
    const current = localStorage.getItem("globalchat_profanity_filter") === "true";
    localStorage.setItem("globalchat_profanity_filter", String(!current));
    broadcast("toggle_profanity_filter", { enabled: !current });
    addModLogEntry({ username: OWNER, message: "", timestamp: Date.now(), reason: `Profanity filter ${!current ? "enabled" : "disabled"}` });
    showStatus(`✅ Profanity filter ${!current ? "enabled" : "disabled"}`);
  };

  const handleImpersonateBot = () => {
    if (!impersonateText.trim()) return;
    const msg: ChatMessage = {
      id: `bot-${Date.now()}`,
      username: "G.AI 🤖",
      text: impersonateText.trim(),
      timestamp: Date.now(),
      isBigMessage: false,
      isForced: false,
      isBot: true,
      isSystem: false,
      isBroadcast: false,
    };
    onSendMessage(msg);
    setImpersonateText("");
    showStatus("✅ Bot message sent");
  };

  const handleExportChatLog = () => {
    const lines = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString();
      return `[${time}] ${m.username}: ${m.text}`;
    });
    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-log-${Date.now()}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus("✅ Chat log exported");
  };

  const getOnlineUsers = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem("globalchat_online_users") || "[]");
    } catch { return []; }
  };

  const inputClass = "w-full bg-discord-dark border border-discord-border rounded px-3 py-2 text-sm text-discord-text placeholder-discord-muted focus:outline-none focus:border-discord-accent";
  const btnClass = "px-3 py-2 rounded text-sm font-medium transition-colors";
  const primaryBtn = `${btnClass} bg-discord-accent hover:bg-discord-accent/80 text-white`;
  const dangerBtn = `${btnClass} bg-red-600 hover:bg-red-700 text-white`;
  const successBtn = `${btnClass} bg-green-600 hover:bg-green-700 text-white`;
  const warningBtn = `${btnClass} bg-yellow-600 hover:bg-yellow-700 text-white`;
  const grayBtn = `${btnClass} bg-discord-sidebar hover:bg-discord-border text-discord-text`;

  const tabs = [
    { id: "moderation", label: "Moderation", icon: <Shield size={14} /> },
    { id: "server", label: "Server", icon: <Server size={14} /> },
    { id: "chat", label: "Chat", icon: <Lock size={14} /> },
    { id: "message", label: "Messages", icon: <MessageSquare size={14} /> },
    { id: "more", label: "More", icon: <ChevronDown size={14} /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-discord-sidebar border border-discord-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-discord-border">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-discord-accent" />
            <h2 className="text-lg font-bold text-discord-header">Admin Panel</h2>
            <span className="text-xs bg-discord-accent/20 text-discord-accent px-2 py-0.5 rounded-full">Owner</span>
          </div>
          <button onClick={onClose} className="text-discord-muted hover:text-discord-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div className="mx-5 mt-3 px-3 py-2 bg-discord-dark rounded text-sm text-green-400 border border-green-800">
            {statusMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-discord-border px-5 pt-3 gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-discord-dark text-discord-header border-b-2 border-discord-accent"
                  : "text-discord-muted hover:text-discord-text"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* MODERATION TAB */}
          {activeTab === "moderation" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-discord-muted mb-1">Target Username</label>
                <input
                  className={inputClass}
                  placeholder="Enter username..."
                  value={targetUser}
                  onChange={e => setTargetUser(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-discord-muted mb-1">Ban Duration (minutes)</label>
                  <input className={inputClass} type="number" value={banDuration} onChange={e => setBanDuration(e.target.value)} min="1" />
                </div>
                <div>
                  <label className="block text-xs text-discord-muted mb-1">Mute Duration (minutes)</label>
                  <input className={inputClass} type="number" value={muteDuration} onChange={e => setMuteDuration(e.target.value)} min="1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleBan} className={dangerBtn}>
                  <Ban size={14} className="inline mr-1" />Ban User
                </button>
                <button onClick={handleUnban} className={successBtn}>
                  <Ban size={14} className="inline mr-1" />Unban User
                </button>
                <button onClick={handleMute} className={warningBtn}>
                  <VolumeX size={14} className="inline mr-1" />Mute User
                </button>
                <button onClick={handleUnmute} className={successBtn}>
                  <Volume2 size={14} className="inline mr-1" />Unmute User
                </button>
                <button onClick={handleMassMute} className={dangerBtn}>
                  <Users size={14} className="inline mr-1" />Mass Mute
                </button>
                <button onClick={handleMassUnmute} className={successBtn}>
                  <Users size={14} className="inline mr-1" />Mass Unmute
                </button>
              </div>
            </div>
          )}

          {/* SERVER TAB */}
          {activeTab === "server" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-discord-muted mb-1">Shutdown Duration (minutes)</label>
                  <input className={inputClass} type="number" value={shutdownDuration} onChange={e => setShutdownDuration(e.target.value)} min="1" />
                </div>
                <div>
                  <label className="block text-xs text-discord-muted mb-1">Shutdown Message</label>
                  <input className={inputClass} placeholder="Optional message..." value={shutdownMessage} onChange={e => setShutdownMessage(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleShutdown} className={dangerBtn}>
                  <Server size={14} className="inline mr-1" />Shutdown Server
                </button>
                <button onClick={handleStartup} className={successBtn}>
                  <Server size={14} className="inline mr-1" />Start Up Server
                </button>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-discord-muted mb-1">Slow Mode (seconds)</label>
                <input className={inputClass} type="number" value={slowModeSeconds} onChange={e => setSlowModeSeconds(e.target.value)} min="1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSlowMode} className={warningBtn}>
                  <Lock size={14} className="inline mr-1" />Enable Slow Mode
                </button>
                <button onClick={handleDisableSlowMode} className={successBtn}>
                  <Unlock size={14} className="inline mr-1" />Disable Slow Mode
                </button>
                <button onClick={handleLockChat} className={dangerBtn}>
                  <Lock size={14} className="inline mr-1" />Lock Chat
                </button>
                <button onClick={handleUnlockChat} className={successBtn}>
                  <Unlock size={14} className="inline mr-1" />Unlock Chat
                </button>
              </div>
            </div>
          )}

          {/* MESSAGE TAB */}
          {activeTab === "message" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-discord-muted mb-1">Big Message Text</label>
                <input className={inputClass} placeholder="Enter announcement..." value={bigMessageText} onChange={e => setBigMessageText(e.target.value)} />
                <button onClick={handleBigMessage} className={`${primaryBtn} mt-2 w-full`}>
                  <Megaphone size={14} className="inline mr-1" />Send Big Message
                </button>
              </div>
              <div>
                <label className="block text-xs text-discord-muted mb-1">Force Text - Target User</label>
                <input className={inputClass} placeholder="Username to impersonate..." value={forceTarget} onChange={e => setForceTarget(e.target.value)} />
                <label className="block text-xs text-discord-muted mb-1 mt-2">Force Text - Message</label>
                <input className={inputClass} placeholder="Message to force..." value={forceText} onChange={e => setForceText(e.target.value)} />
                <button onClick={handleForceText} className={`${warningBtn} mt-2 w-full`}>
                  <MessageSquare size={14} className="inline mr-1" />Send Force Text
                </button>
              </div>
            </div>
          )}

          {/* MORE COMMANDS TAB */}
          {activeTab === "more" && (
            <div className="space-y-5">
              {/* Rename User */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Rename User</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Current name..." value={renameUser} onChange={e => setRenameUser(e.target.value)} />
                  <input className={inputClass} placeholder="New name..." value={renameNewName} onChange={e => setRenameNewName(e.target.value)} />
                </div>
                <button onClick={handleRenameUser} className={`${primaryBtn} w-full`}>Rename User</button>
              </div>

              {/* Clear All Chat */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Clear All Chat</h3>
                <button onClick={handleClearAllChat} className={`${dangerBtn} w-full`}>🗑️ Clear All Chat</button>
              </div>

              {/* Pin / Unpin Message */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Pin / Unpin Message</h3>
                <input className={inputClass} placeholder="Message ID or text snippet..." value={pinMessageId} onChange={e => setPinMessageId(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handlePinMessage} className={primaryBtn}>
                    <Pin size={14} className="inline mr-1" />Pin Message
                  </button>
                  <button onClick={handleUnpinMessage} className={grayBtn}>
                    <Pin size={14} className="inline mr-1" />Unpin Message
                  </button>
                </div>
              </div>

              {/* Announce Role */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Announce Role</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Username..." value={announceUser} onChange={e => setAnnounceUser(e.target.value)} />
                  <input className={inputClass} placeholder="Role name..." value={announceRole} onChange={e => setAnnounceRole(e.target.value)} />
                </div>
                <button onClick={handleAnnounceRole} className={`${primaryBtn} w-full`}>📣 Announce Role</button>
              </div>

              {/* Change Theme */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Change Theme</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleChangeTheme("default")} className={grayBtn}>Default</button>
                  <button onClick={() => handleChangeTheme("neon")} className={`${btnClass} bg-purple-700 hover:bg-purple-800 text-white`}>Neon</button>
                  <button onClick={() => handleChangeTheme("retro")} className={`${btnClass} bg-orange-700 hover:bg-orange-800 text-white`}>Retro</button>
                </div>
              </div>

              {/* Slow Mode (duplicate in More) */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Slow Mode</h3>
                <input className={inputClass} type="number" placeholder="Seconds..." value={slowModeSeconds} onChange={e => setSlowModeSeconds(e.target.value)} min="1" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleSlowMode} className={warningBtn}>Enable</button>
                  <button onClick={handleDisableSlowMode} className={successBtn}>Disable</button>
                </div>
              </div>

              {/* Lock / Unlock Chat (duplicate in More) */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Lock / Unlock Chat</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleLockChat} className={dangerBtn}>🔒 Lock Chat</button>
                  <button onClick={handleUnlockChat} className={successBtn}>🔓 Unlock Chat</button>
                </div>
              </div>

              {/* Mass Mute / Unmute (duplicate in More) */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Mass Mute / Unmute</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleMassMute} className={dangerBtn}>🔇 Mass Mute</button>
                  <button onClick={handleMassUnmute} className={successBtn}>🔊 Mass Unmute</button>
                </div>
              </div>

              {/* Fake Join / Leave */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Fake Join / Leave</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Username (join)..." value={fakeJoinUser} onChange={e => setFakeJoinUser(e.target.value)} />
                  <input className={inputClass} placeholder="Username (leave)..." value={fakeLeaveUser} onChange={e => setFakeLeaveUser(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleFakeJoin} className={successBtn}>👋 Fake Join</button>
                  <button onClick={handleFakeLeave} className={dangerBtn}>👋 Fake Leave</button>
                </div>
              </div>

              {/* Set / Clear MOTD */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Set / Clear MOTD</h3>
                <input className={inputClass} placeholder="Message of the day..." value={motdText} onChange={e => setMotdText(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleSetMOTD} className={primaryBtn}>📌 Set MOTD</button>
                  <button onClick={handleClearMOTD} className={grayBtn}>🗑️ Clear MOTD</button>
                </div>
              </div>

              {/* Highlight User */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Highlight User</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Username..." value={highlightUser} onChange={e => setHighlightUser(e.target.value)} />
                  <input type="color" className="w-full h-10 rounded cursor-pointer bg-discord-dark border border-discord-border" value={highlightColor} onChange={e => setHighlightColor(e.target.value)} />
                </div>
                <button onClick={handleHighlightUser} className={`${primaryBtn} w-full`}>
                  <Star size={14} className="inline mr-1" />Highlight User
                </button>
              </div>

              {/* Shadowban / Unshadowban */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Shadowban / Unshadowban</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} placeholder="Shadowban user..." value={shadowbanUser} onChange={e => setShadowbanUser(e.target.value)} />
                  <input className={inputClass} placeholder="Unshadowban user..." value={unshadowbanUser} onChange={e => setUnshadowbanUser(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleShadowban} className={dangerBtn}>
                    <UserX size={14} className="inline mr-1" />Shadowban
                  </button>
                  <button onClick={handleUnshadowban} className={successBtn}>
                    <UserX size={14} className="inline mr-1" />Unshadowban
                  </button>
                </div>
              </div>

              {/* Rename Channel */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Rename Channel</h3>
                <input className={inputClass} placeholder="New channel name..." value={renameChannel} onChange={e => setRenameChannel(e.target.value)} />
                <button onClick={handleRenameChannel} className={`${primaryBtn} w-full`}>
                  <Hash size={14} className="inline mr-1" />Rename Channel
                </button>
              </div>

              {/* Set / Reset User Limit */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Set / Reset User Limit</h3>
                <input className={inputClass} type="number" placeholder="Max users..." value={userLimit} onChange={e => setUserLimit(e.target.value)} min="1" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleSetUserLimit} className={primaryBtn}>Set Limit</button>
                  <button onClick={handleResetUserLimit} className={grayBtn}>Reset Limit</button>
                </div>
              </div>

              {/* Toggle Profanity Filter */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Toggle Profanity Filter</h3>
                <button onClick={handleToggleProfanityFilter} className={`${warningBtn} w-full`}>
                  <AlertTriangle size={14} className="inline mr-1" />Toggle Profanity Filter
                </button>
              </div>

              {/* Impersonate Bot */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Impersonate Bot</h3>
                <input className={inputClass} placeholder="Bot message..." value={impersonateText} onChange={e => setImpersonateText(e.target.value)} />
                <button onClick={handleImpersonateBot} className={`${primaryBtn} w-full`}>🤖 Send as Bot</button>
              </div>

              {/* Export Chat Log */}
              <div className="bg-discord-dark rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold text-discord-muted uppercase tracking-wide">Export Chat Log</h3>
                <select className={inputClass} value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                  <option value="txt">Text (.txt)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
                <button onClick={handleExportChatLog} className={`${primaryBtn} w-full`}>
                  <FileText size={14} className="inline mr-1" />Export Chat Log
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
