import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile } from "lucide-react";
import { useMuteManager } from "@/hooks/useMuteManager";
import { useBanManager } from "@/hooks/useBanManager";
import { useSlowMode } from "@/hooks/useSlowMode";
import { useChatLock } from "@/hooks/useChatLock";

interface MessageInputBarProps {
  onSend: (text: string) => void;
  onEmojiPickerToggle: () => void;
  username: string;
  disabled?: boolean;
}

const OWNER = "AI.Caffeine";
const BOT_NAME = "G.AI 🤖";

export default function MessageInputBar({ onSend, onEmojiPickerToggle, username, disabled }: MessageInputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [warningMsg, setWarningMsg] = useState("");

  const { isUserMuted, getRemainingMuteMinutes } = useMuteManager();
  const { isUserBanned, getRemainingBanMinutes } = useBanManager();
  const { isInCooldown, getRemainingCooldownSeconds, recordMessageSent } = useSlowMode();
  const { isChatLocked } = useChatLock();

  const [enforcementStatus, setEnforcementStatus] = useState<{
    blocked: boolean;
    reason: string;
  }>({ blocked: false, reason: "" });

  const checkEnforcement = useCallback(() => {
    if (username === OWNER || username === BOT_NAME) {
      setEnforcementStatus({ blocked: false, reason: "" });
      return;
    }

    if (isUserBanned(username)) {
      const mins = getRemainingBanMinutes(username);
      setEnforcementStatus({ blocked: true, reason: `You are banned for ${mins} minute${mins !== 1 ? "s" : ""} due to a violation.` });
      return;
    }

    if (isUserMuted(username)) {
      const mins = getRemainingMuteMinutes(username);
      setEnforcementStatus({ blocked: true, reason: `You are muted for ${mins} minute${mins !== 1 ? "s" : ""}.` });
      return;
    }

    if (isChatLocked(username)) {
      setEnforcementStatus({ blocked: true, reason: "Chat is locked." });
      return;
    }

    setEnforcementStatus({ blocked: false, reason: "" });
  }, [username, isUserBanned, getRemainingBanMinutes, isUserMuted, getRemainingMuteMinutes, isChatLocked]);

  useEffect(() => {
    checkEnforcement();
    const interval = setInterval(checkEnforcement, 1000);
    return () => clearInterval(interval);
  }, [checkEnforcement]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (enforcementStatus.blocked) {
      setWarningMsg(enforcementStatus.reason);
      setTimeout(() => setWarningMsg(""), 3000);
      return;
    }

    // Check slow mode at send time
    if (username !== OWNER && username !== BOT_NAME && isInCooldown(username)) {
      const secs = getRemainingCooldownSeconds(username);
      setWarningMsg(`Please wait ${secs} second${secs !== 1 ? "s" : ""} before sending another message.`);
      setTimeout(() => setWarningMsg(""), 3000);
      return;
    }

    // Check shadowban
    const shadowbans: string[] = JSON.parse(localStorage.getItem("globalchat_shadowbans") || "[]");
    if (shadowbans.includes(username)) {
      // Silently "send" but don't actually send
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      return;
    }

    recordMessageSent(username);
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBlocked = enforcementStatus.blocked || disabled;
  const displayWarning = warningMsg || (enforcementStatus.blocked ? enforcementStatus.reason : "");

  return (
    <div className="px-4 py-3" style={{ backgroundColor: "#313338", borderTop: "1px solid #1e1f22" }}>
      {displayWarning && (
        <div
          className="mb-2 px-3 py-1.5 rounded text-xs"
          style={{ backgroundColor: "#ed424520", border: "1px solid #ed424560", color: "#ed4245" }}
        >
          {displayWarning}
        </div>
      )}
      <div
        className="flex items-end gap-2 rounded-lg px-3 py-2"
        style={{
          backgroundColor: "#383a40",
          opacity: isBlocked ? 0.6 : 1,
        }}
      >
        <button
          onClick={onEmojiPickerToggle}
          className="mb-1 shrink-0 transition-colors"
          style={{ color: "#96989d" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dcddde"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#96989d"}
          title="Emoji picker (Ctrl+Alt)"
        >
          <Smile size={20} />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBlocked}
          placeholder={isBlocked ? (enforcementStatus.reason || "You cannot send messages right now.") : `Message #general`}
          rows={1}
          className="flex-1 bg-transparent resize-none focus:outline-none text-sm leading-5 py-1"
          style={{
            color: "#dcddde",
            minHeight: "24px",
            maxHeight: "120px",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isBlocked}
          className="mb-1 shrink-0 transition-colors disabled:opacity-40"
          style={{ color: "#96989d" }}
          onMouseEnter={e => {
            if (!(!text.trim() || isBlocked)) {
              (e.currentTarget as HTMLElement).style.color = "#5865f2";
            }
          }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#96989d"}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
