import { Globe, Settings, LogOut, Users } from "lucide-react";

interface TopBarProps {
  channelName: string;
  onlineCount: number;
  username: string;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
}

const OWNER = "AI.Caffeine";

export default function TopBar({ channelName, onlineCount, username, onOpenAdminPanel, onLogout }: TopBarProps) {
  return (
    <div
      className="h-12 flex items-center justify-between px-4 shrink-0"
      style={{ backgroundColor: "#313338", borderBottom: "1px solid #1e1f22" }}
    >
      <div className="flex items-center gap-2">
        <Globe size={16} style={{ color: "#96989d" }} />
        <span className="font-semibold text-white text-sm">{channelName}</span>
        <span className="mx-2" style={{ color: "#4f5660" }}>|</span>
        <Users size={14} style={{ color: "#96989d" }} />
        <span className="text-xs" style={{ color: "#96989d" }}>{onlineCount} online</span>
      </div>
      <div className="flex items-center gap-2">
        {username === OWNER && (
          <button
            onClick={onOpenAdminPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#5865f2" }}
          >
            <Settings size={14} />
            Admin Panel
          </button>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors"
          style={{ color: "#96989d" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "#dcddde";
            (e.currentTarget as HTMLElement).style.backgroundColor = "#35373c";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "#96989d";
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
}
