import { Hash, Volume2, LogOut, Crown } from "lucide-react";
import { isVerifiedOwner, VerifiedOwnerBadge } from "@/lib/userBadges";

interface SidebarProps {
  currentChannel: string;
  onlineUsers: string[];
  currentUsername: string;
  onLogout: () => void;
}

const channels = [
  { name: "general", type: "text" },
  { name: "announcements", type: "text" },
  { name: "off-topic", type: "text" },
  { name: "voice-chat", type: "voice" },
];

function getAvatarColor(username: string): string {
  const colors = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245",
    "#3BA55D", "#FAA61A", "#00B0F4", "#9B59B6", "#E91E63",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Sidebar({ currentChannel, onlineUsers, currentUsername, onLogout }: SidebarProps) {
  return (
    <div
      className="w-60 flex flex-col shrink-0"
      style={{ backgroundColor: "#2b2d31", borderRight: "1px solid #1e1f22" }}
    >
      {/* Server Header */}
      <div
        className="h-12 px-4 flex items-center"
        style={{ borderBottom: "1px solid #1e1f22" }}
      >
        <h1 className="font-bold text-white text-sm truncate">Global Chat</h1>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#96989d" }}>
            Text Channels
          </span>
        </div>
        {channels.map(ch => (
          <div
            key={ch.name}
            className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded cursor-pointer transition-colors"
            style={{
              backgroundColor: ch.name === currentChannel ? "#35373c" : "transparent",
              color: ch.name === currentChannel ? "#f2f3f5" : "#96989d",
            }}
            onMouseEnter={e => {
              if (ch.name !== currentChannel) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#35373c80";
                (e.currentTarget as HTMLElement).style.color = "#dcddde";
              }
            }}
            onMouseLeave={e => {
              if (ch.name !== currentChannel) {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#96989d";
              }
            }}
          >
            {ch.type === "voice" ? (
              <Volume2 size={16} className="shrink-0" />
            ) : (
              <Hash size={16} className="shrink-0" />
            )}
            <span className="text-sm truncate">{ch.name}</span>
          </div>
        ))}

        {/* Online Users */}
        <div className="px-3 mt-4 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#96989d" }}>
            Online — {onlineUsers.length}
          </span>
        </div>
        {onlineUsers.map(user => {
          const isOwner = isVerifiedOwner(user);
          const isCurrentUser = user === currentUsername;
          const avatarColor = isOwner ? "#FAA61A" : getAvatarColor(user);
          return (
            <div
              key={user}
              className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded transition-colors cursor-default"
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#35373c80";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: avatarColor }}
                >
                  {user.charAt(0).toUpperCase()}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#3ba55d", border: "2px solid #2b2d31" }}
                />
              </div>
              <span
                className="text-sm truncate"
                style={{ color: isCurrentUser ? "#f2f3f5" : "#96989d", fontWeight: isCurrentUser ? 500 : 400 }}
              >
                {user}
              </span>
              {isOwner && <VerifiedOwnerBadge />}
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div
        className="h-14 px-3 flex items-center gap-2"
        style={{ backgroundColor: "#232428", borderTop: "1px solid #1e1f22" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: isVerifiedOwner(currentUsername) ? "#FAA61A" : getAvatarColor(currentUsername) }}
        >
          {currentUsername.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-white text-sm font-medium truncate">{currentUsername}</span>
            {isVerifiedOwner(currentUsername) && <Crown size={12} className="text-yellow-400 shrink-0" />}
          </div>
          <span className="text-xs" style={{ color: "#96989d" }}>Online</span>
        </div>
        <button
          onClick={onLogout}
          className="transition-colors"
          style={{ color: "#96989d" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dcddde"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#96989d"}
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
