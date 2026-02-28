import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Ban, Trash2, RefreshCw, Clock, AlertTriangle,
  VolumeX, Volume2, UserX, UserCheck, Megaphone, Send, Terminal,
  Power, PowerOff, Lock, Unlock, Pin, PinOff, Palette, Zap,
  Ghost, Download, Hash, Users, Filter, Bot, Star, Eye, EyeOff,
  MessageSquare, MoreHorizontal, Settings
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { getActiveBans, useBanManager } from '../hooks/useBanManager';
import { getActiveMutes, useMuteManager } from '../hooks/useMuteManager';
import { getModLog, clearModLog, ModLogEntry } from '../lib/modLog';
import { useServerState } from '../hooks/useServerState';
import { useAdminCommands } from '../hooks/useAdminCommands';
import { parseDurationInput } from '../lib/serverState';
import { ChatMessage } from '../types/chat';

interface BanEntry { username: string; expiresAt: number; reason?: string; }
interface MuteEntry { username: string; expiresAt: number; reason?: string; }

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  onSendMessage: (
    text: string,
    overrideUsername?: string,
    isBot?: boolean,
    extras?: Partial<Pick<ChatMessage, 'isBigMessage' | 'isForced'>>
  ) => void;
}

function formatTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type FeedbackState = { type: 'success' | 'error'; message: string } | null;

function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const show = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }, []);
  return { feedback, show };
}

function FeedbackBadge({ fb }: { fb: FeedbackState }) {
  if (!fb) return null;
  return (
    <p className={`text-xs mt-1.5 px-2 py-1 rounded-lg ${
      fb.type === 'success'
        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>
      {fb.type === 'success' ? '✓ ' : '✗ '}{fb.message}
    </p>
  );
}

function CommandCard({ icon, title, description, children }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-dc-bg/50 rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="text-xs text-dc-muted mb-2">{description}</p>
      {children}
    </div>
  );
}

export default function AdminPanel({ open, onClose, onSendMessage }: AdminPanelProps) {
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [mutes, setMutes] = useState<MuteEntry[]>([]);
  const [modLog, setModLog] = useState<ModLogEntry[]>([]);
  const [tick, setTick] = useState(0);

  // Original command inputs
  const [banTarget, setBanTarget] = useState('');
  const [unbanTarget, setUnbanTarget] = useState('');
  const [muteTarget, setMuteTarget] = useState('');
  const [unmuteTarget, setUnmuteTarget] = useState('');
  const [bigMessage, setBigMessage] = useState('');
  const [forceTarget, setForceTarget] = useState('');
  const [forceText, setForceText] = useState('');

  // Server control inputs
  const [shutdownDuration, setShutdownDuration] = useState('10:00');
  const [shutdownMsg, setShutdownMsg] = useState('');

  // More commands inputs
  const [renameOld, setRenameOld] = useState('');
  const [renameNew, setRenameNew] = useState('');
  const [pinMsgId, setPinMsgId] = useState('');
  const [announceUser, setAnnounceUser] = useState('');
  const [announceRole, setAnnounceRole] = useState('');
  const [themeChoice, setThemeChoice] = useState('dark');
  const [slowModeSecs, setSlowModeSecs] = useState('5');
  const [massMuteMins, setMassMuteMins] = useState('5');
  const [fakeJoinUser, setFakeJoinUser] = useState('');
  const [fakeLeaveUser, setFakeLeaveUser] = useState('');
  const [motdText, setMotdText] = useState('');
  const [highlightUser, setHighlightUser] = useState('');
  const [highlightColor, setHighlightColor] = useState('#f59e0b');
  const [highlightDuration, setHighlightDuration] = useState('60');
  const [shadowbanUser, setShadowbanUser] = useState('');
  const [unshadowbanUser, setUnshadowbanUser] = useState('');
  const [channelName, setChannelName] = useState('');
  const [userLimit, setUserLimit] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [massBanMins, setMassBanMins] = useState('10');

  const { banUser, unbanUser } = useBanManager();
  const { muteUser, unmuteUser } = useMuteManager();
  const { isShutdown, remainingMs, shutdown, startup } = useServerState();

  const adminCmds = useAdminCommands(onSendMessage as (text: string, overrideUsername?: string, isBot?: boolean, extras?: Record<string, unknown>) => void);

  // Feedback hooks
  const banFb = useFeedback();
  const unbanFb = useFeedback();
  const muteFb = useFeedback();
  const unmuteFb = useFeedback();
  const bigMsgFb = useFeedback();
  const forceFb = useFeedback();
  const shutdownFb = useFeedback();
  const startupFb = useFeedback();
  const cmd1Fb = useFeedback();
  const cmd2Fb = useFeedback();
  const cmd3Fb = useFeedback();
  const cmd4Fb = useFeedback();
  const cmd5Fb = useFeedback();
  const cmd6Fb = useFeedback();
  const cmd7Fb = useFeedback();
  const cmd8Fb = useFeedback();
  const cmd9Fb = useFeedback();
  const cmd10Fb = useFeedback();
  const cmd11Fb = useFeedback();
  const cmd12Fb = useFeedback();
  const cmd13Fb = useFeedback();
  const cmd14Fb = useFeedback();
  const cmd15Fb = useFeedback();
  const cmd16Fb = useFeedback();
  const cmd17Fb = useFeedback();
  const cmd18Fb = useFeedback();
  const cmd19Fb = useFeedback();
  const cmd20Fb = useFeedback();
  const cmd21Fb = useFeedback();
  const cmd22Fb = useFeedback();
  const cmd23Fb = useFeedback();
  const cmd24Fb = useFeedback();
  const cmd25Fb = useFeedback();

  const refresh = useCallback(() => {
    setBans(getActiveBans());
    setMutes(getActiveMutes());
    setModLog(getModLog());
  }, []);

  useEffect(() => { if (open) refresh(); }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [open]);

  void tick;

  // Original handlers
  const handleBan = () => {
    const t = banTarget.trim();
    if (!t) { banFb.show('error', 'Enter a username to ban.'); return; }
    if (t === 'AI.Caffeine') { banFb.show('error', 'Cannot ban the owner.'); return; }
    banUser(t, 'Banned by admin');
    banFb.show('success', `${t} has been banned for 10 minutes.`);
    setBanTarget(''); refresh();
  };

  const handleUnban = (username: string) => { unbanUser(username); refresh(); };

  const handleUnbanInput = () => {
    const t = unbanTarget.trim();
    if (!t) { unbanFb.show('error', 'Enter a username to unban.'); return; }
    unbanUser(t);
    unbanFb.show('success', `${t} has been unbanned.`);
    setUnbanTarget(''); refresh();
  };

  const handleMute = () => {
    const t = muteTarget.trim();
    if (!t) { muteFb.show('error', 'Enter a username to mute.'); return; }
    if (t === 'AI.Caffeine') { muteFb.show('error', 'Cannot mute the owner.'); return; }
    muteUser(t, 10 * 60 * 1000, 'Muted by admin');
    muteFb.show('success', `${t} has been muted for 10 minutes.`);
    setMuteTarget(''); refresh();
  };

  const handleUnmute = () => {
    const t = unmuteTarget.trim();
    if (!t) { unmuteFb.show('error', 'Enter a username to unmute.'); return; }
    unmuteUser(t);
    unmuteFb.show('success', `${t} has been unmuted.`);
    setUnmuteTarget(''); refresh();
  };

  const handleBigMessage = () => {
    const text = bigMessage.trim();
    if (!text) { bigMsgFb.show('error', 'Enter a message to broadcast.'); return; }
    onSendMessage(text, 'AI.Caffeine', false, { isBigMessage: true });
    bigMsgFb.show('success', 'Server announcement broadcast!');
    setBigMessage('');
  };

  const handleForceText = () => {
    const target = forceTarget.trim();
    const text = forceText.trim();
    if (!target) { forceFb.show('error', 'Enter a target username.'); return; }
    if (!text) { forceFb.show('error', 'Enter a message to force send.'); return; }
    onSendMessage(text, target, false, { isForced: true });
    forceFb.show('success', `Message force-sent as ${target}.`);
    setForceTarget(''); setForceText('');
  };

  const handleShutdown = () => {
    const durationMs = parseDurationInput(shutdownDuration);
    if (durationMs === null) { shutdownFb.show('error', 'Invalid format. Use mm:ss (e.g. 10:00).'); return; }
    if (durationMs <= 0) { shutdownFb.show('error', 'Duration must be greater than 0.'); return; }
    if (durationMs > 50 * 60 * 1000) { shutdownFb.show('error', 'Maximum shutdown duration is 50 minutes.'); return; }
    shutdown(durationMs, shutdownMsg.trim(), 'AI.Caffeine');
    shutdownFb.show('success', `Server shut down for ${shutdownDuration}.`);
  };

  const handleStartup = () => {
    startup();
    startupFb.show('success', 'Server started up successfully!');
  };

  const handleClearLog = () => { clearModLog(); setModLog([]); };

  const runCmd = (fb: ReturnType<typeof useFeedback>, fn: () => string) => {
    const result = fn();
    fb.show(result.startsWith('✓') ? 'success' : 'error', result.replace(/^[✓✗] /, ''));
  };

  const formatRemainingShutdown = () => {
    if (!isShutdown) return '';
    const totalSecs = Math.ceil(remainingMs / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[560px] bg-dc-sidebar border-l border-white/10 text-white p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <SheetTitle className="text-white text-base font-bold">Admin Panel</SheetTitle>
              <SheetDescription className="text-dc-muted text-xs">
                Moderation controls for AI.Caffeine
              </SheetDescription>
            </div>
            {isShutdown && (
              <div className="ml-auto flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs font-mono font-bold">{formatRemainingShutdown()}</span>
              </div>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-4 py-3">
          <Tabs defaultValue="commands" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="bg-dc-bg/60 border border-white/10 mb-4 shrink-0 grid grid-cols-4">
              <TabsTrigger value="commands" className="text-xs data-[state=active]:bg-dc-accent data-[state=active]:text-white">
                <Terminal className="w-3 h-3 mr-1" />
                Commands
              </TabsTrigger>
              <TabsTrigger value="server" className="text-xs data-[state=active]:bg-dc-accent data-[state=active]:text-white">
                <Settings className="w-3 h-3 mr-1" />
                Server
              </TabsTrigger>
              <TabsTrigger value="more" className="text-xs data-[state=active]:bg-dc-accent data-[state=active]:text-white">
                <MoreHorizontal className="w-3 h-3 mr-1" />
                More
              </TabsTrigger>
              <TabsTrigger value="bans" className="text-xs data-[state=active]:bg-dc-accent data-[state=active]:text-white">
                <Ban className="w-3 h-3 mr-1" />
                Bans
              </TabsTrigger>
            </TabsList>

            {/* ── Commands Tab ── */}
            <TabsContent value="commands" className="flex-1 overflow-y-auto mt-0 space-y-3">
              <CommandCard icon={<UserX className="w-4 h-4 text-red-400" />} title="Ban User" description="Prevents a user from sending messages for 10 minutes.">
                <div className="flex gap-2">
                  <Input value={banTarget} onChange={e => setBanTarget(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBan()} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={handleBan} className="h-8 px-3 text-xs bg-red-500/80 hover:bg-red-500 text-white border-0"><Ban className="w-3.5 h-3.5 mr-1" />Ban</Button>
                </div>
                <FeedbackBadge fb={banFb.feedback} />
              </CommandCard>

              <CommandCard icon={<UserCheck className="w-4 h-4 text-green-400" />} title="Unban User" description="Removes an active ban immediately.">
                <div className="flex gap-2">
                  <Input value={unbanTarget} onChange={e => setUnbanTarget(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnbanInput()} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={handleUnbanInput} className="h-8 px-3 text-xs bg-green-500/80 hover:bg-green-500 text-white border-0"><UserCheck className="w-3.5 h-3.5 mr-1" />Unban</Button>
                </div>
                <FeedbackBadge fb={unbanFb.feedback} />
              </CommandCard>

              <CommandCard icon={<VolumeX className="w-4 h-4 text-orange-400" />} title="Mute User" description="Silences a user for 10 minutes.">
                <div className="flex gap-2">
                  <Input value={muteTarget} onChange={e => setMuteTarget(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMute()} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={handleMute} className="h-8 px-3 text-xs bg-orange-500/80 hover:bg-orange-500 text-white border-0"><VolumeX className="w-3.5 h-3.5 mr-1" />Mute</Button>
                </div>
                <FeedbackBadge fb={muteFb.feedback} />
              </CommandCard>

              <CommandCard icon={<Volume2 className="w-4 h-4 text-teal-400" />} title="Unmute User" description="Removes an active mute immediately.">
                <div className="flex gap-2">
                  <Input value={unmuteTarget} onChange={e => setUnmuteTarget(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnmute()} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={handleUnmute} className="h-8 px-3 text-xs bg-teal-500/80 hover:bg-teal-500 text-white border-0"><Volume2 className="w-3.5 h-3.5 mr-1" />Unmute</Button>
                </div>
                <FeedbackBadge fb={unmuteFb.feedback} />
              </CommandCard>

              <CommandCard icon={<Megaphone className="w-4 h-4 text-yellow-400" />} title="Big Message" description="Broadcasts a server-wide announcement banner.">
                <div className="flex gap-2">
                  <Input value={bigMessage} onChange={e => setBigMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBigMessage()} placeholder="Announcement text..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={handleBigMessage} className="h-8 px-3 text-xs bg-yellow-500/80 hover:bg-yellow-500 text-white border-0"><Megaphone className="w-3.5 h-3.5 mr-1" />Send</Button>
                </div>
                <FeedbackBadge fb={bigMsgFb.feedback} />
              </CommandCard>

              <CommandCard icon={<Send className="w-4 h-4 text-purple-400" />} title="Force Text" description="Force-sends a message as any user.">
                <div className="flex gap-2 mb-2">
                  <Input value={forceTarget} onChange={e => setForceTarget(e.target.value)} placeholder="Target username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                </div>
                <div className="flex gap-2">
                  <Input value={forceText} onChange={e => setForceText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForceText()} placeholder="Message to force send..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={handleForceText} className="h-8 px-3 text-xs bg-purple-500/80 hover:bg-purple-500 text-white border-0"><Send className="w-3.5 h-3.5 mr-1" />Force</Button>
                </div>
                <FeedbackBadge fb={forceFb.feedback} />
              </CommandCard>
            </TabsContent>

            {/* ── Server Control Tab ── */}
            <TabsContent value="server" className="flex-1 overflow-y-auto mt-0 space-y-3">
              {/* Shutdown */}
              <CommandCard
                icon={<PowerOff className="w-4 h-4 text-red-400" />}
                title="Shutdown Server"
                description="Shuts down the server for a specified duration (max 50 minutes). Non-owners see a black screen with countdown."
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-dc-muted mb-1 block">Duration (mm:ss, max 50:00)</label>
                    <Input
                      value={shutdownDuration}
                      onChange={e => setShutdownDuration(e.target.value)}
                      placeholder="10:00"
                      className="h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-dc-muted mb-1 block">Shutdown message (optional)</label>
                    <Input
                      value={shutdownMsg}
                      onChange={e => setShutdownMsg(e.target.value)}
                      placeholder="Reason for shutdown..."
                      className="h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted"
                    />
                  </div>
                  <Button
                    onClick={handleShutdown}
                    disabled={isShutdown}
                    className="w-full h-8 text-xs bg-red-600/80 hover:bg-red-600 text-white border-0 gap-1.5"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    {isShutdown ? `Server is shut down (${formatRemainingShutdown()})` : 'Shutdown Server'}
                  </Button>
                </div>
                <FeedbackBadge fb={shutdownFb.feedback} />
              </CommandCard>

              {/* Startup */}
              {isShutdown && (
                <CommandCard
                  icon={<Power className="w-4 h-4 text-green-400" />}
                  title="Start Up Server"
                  description="Brings the server back online immediately. All users will see a green startup screen for 5 seconds."
                >
                  <Button
                    onClick={handleStartup}
                    className="w-full h-8 text-xs bg-green-600/80 hover:bg-green-600 text-white border-0 gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5" />
                    Start Up Server Now
                  </Button>
                  <FeedbackBadge fb={startupFb.feedback} />
                </CommandCard>
              )}

              {/* Lock / Unlock */}
              <CommandCard icon={<Lock className="w-4 h-4 text-yellow-400" />} title="Lock / Unlock Chat" description="Prevents all non-admin users from sending messages.">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => runCmd(cmd9Fb, adminCmds.lockChat)} className="flex-1 h-8 text-xs bg-yellow-500/80 hover:bg-yellow-500 text-white border-0 gap-1"><Lock className="w-3 h-3" />Lock</Button>
                  <Button size="sm" onClick={() => runCmd(cmd10Fb, adminCmds.unlockChat)} className="flex-1 h-8 text-xs bg-green-500/80 hover:bg-green-500 text-white border-0 gap-1"><Unlock className="w-3 h-3" />Unlock</Button>
                </div>
                <FeedbackBadge fb={cmd9Fb.feedback} />
                <FeedbackBadge fb={cmd10Fb.feedback} />
              </CommandCard>

              {/* Slow Mode */}
              <CommandCard icon={<Clock className="w-4 h-4 text-blue-400" />} title="Slow Mode" description="Sets a cooldown between messages for all non-admin users.">
                <div className="flex gap-2 mb-2">
                  <Input value={slowModeSecs} onChange={e => setSlowModeSecs(e.target.value)} placeholder="Seconds..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd7Fb, () => adminCmds.enableSlowMode(parseInt(slowModeSecs) || 5))} className="h-8 px-3 text-xs bg-blue-500/80 hover:bg-blue-500 text-white border-0">Enable</Button>
                  <Button size="sm" onClick={() => runCmd(cmd8Fb, adminCmds.disableSlowMode)} className="h-8 px-3 text-xs bg-gray-500/80 hover:bg-gray-500 text-white border-0">Disable</Button>
                </div>
                <FeedbackBadge fb={cmd7Fb.feedback} />
                <FeedbackBadge fb={cmd8Fb.feedback} />
              </CommandCard>

              {/* Mass Mute / Unmute */}
              <CommandCard icon={<VolumeX className="w-4 h-4 text-orange-400" />} title="Mass Mute / Unmute" description="Mutes or unmutes all users at once.">
                <div className="flex gap-2 mb-2">
                  <Input value={massMuteMins} onChange={e => setMassMuteMins(e.target.value)} placeholder="Minutes..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd11Fb, () => adminCmds.massMute(parseInt(massMuteMins) || 5))} className="h-8 px-3 text-xs bg-orange-500/80 hover:bg-orange-500 text-white border-0">Mass Mute</Button>
                  <Button size="sm" onClick={() => runCmd(cmd12Fb, adminCmds.massUnmute)} className="h-8 px-3 text-xs bg-teal-500/80 hover:bg-teal-500 text-white border-0">Unmute All</Button>
                </div>
                <FeedbackBadge fb={cmd11Fb.feedback} />
                <FeedbackBadge fb={cmd12Fb.feedback} />
              </CommandCard>

              {/* Mass Ban / Unban */}
              <CommandCard icon={<Ban className="w-4 h-4 text-red-400" />} title="Mass Ban / Unban" description="Bans or unbans all users at once.">
                <div className="flex gap-2 mb-2">
                  <Input value={massBanMins} onChange={e => setMassBanMins(e.target.value)} placeholder="Minutes..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd24Fb, () => adminCmds.massBan(parseInt(massBanMins) || 10))} className="h-8 px-3 text-xs bg-red-500/80 hover:bg-red-500 text-white border-0">Mass Ban</Button>
                  <Button size="sm" onClick={() => runCmd(cmd25Fb, adminCmds.massUnban)} className="h-8 px-3 text-xs bg-green-500/80 hover:bg-green-500 text-white border-0">Unban All</Button>
                </div>
                <FeedbackBadge fb={cmd24Fb.feedback} />
                <FeedbackBadge fb={cmd25Fb.feedback} />
              </CommandCard>

              {/* Clear All Chat */}
              <CommandCard icon={<Trash2 className="w-4 h-4 text-red-400" />} title="Clear All Chat" description="Permanently deletes all messages from the chat.">
                <Button onClick={() => runCmd(cmd2Fb, adminCmds.clearAllChat)} className="w-full h-8 text-xs bg-red-500/80 hover:bg-red-500 text-white border-0 gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />Clear All Messages
                </Button>
                <FeedbackBadge fb={cmd2Fb.feedback} />
              </CommandCard>
            </TabsContent>

            {/* ── More Commands Tab ── */}
            <TabsContent value="more" className="flex-1 overflow-y-auto mt-0 space-y-3">
              {/* 1. Rename User */}
              <CommandCard icon={<Users className="w-4 h-4 text-cyan-400" />} title="Rename User" description="Changes a user's display name in the user list.">
                <div className="flex gap-2 mb-2">
                  <Input value={renameOld} onChange={e => setRenameOld(e.target.value)} placeholder="Current name..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Input value={renameNew} onChange={e => setRenameNew(e.target.value)} placeholder="New name..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                </div>
                <Button size="sm" onClick={() => runCmd(cmd1Fb, () => adminCmds.renameUser(renameOld, renameNew))} className="w-full h-8 text-xs bg-cyan-500/80 hover:bg-cyan-500 text-white border-0">Rename</Button>
                <FeedbackBadge fb={cmd1Fb.feedback} />
              </CommandCard>

              {/* 3. Pin Message */}
              <CommandCard icon={<Pin className="w-4 h-4 text-dc-accent" />} title="Pin Message" description="Pins a message by its ID at the top of the chat.">
                <div className="flex gap-2">
                  <Input value={pinMsgId} onChange={e => setPinMsgId(e.target.value)} placeholder="Message ID..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted font-mono" />
                  <Button size="sm" onClick={() => runCmd(cmd3Fb, () => adminCmds.pinMessage(pinMsgId))} className="h-8 px-3 text-xs bg-dc-accent/80 hover:bg-dc-accent text-white border-0">Pin</Button>
                  <Button size="sm" onClick={() => runCmd(cmd4Fb, adminCmds.unpinMessage)} className="h-8 px-3 text-xs bg-gray-500/80 hover:bg-gray-500 text-white border-0"><PinOff className="w-3 h-3" /></Button>
                </div>
                <FeedbackBadge fb={cmd3Fb.feedback} />
                <FeedbackBadge fb={cmd4Fb.feedback} />
              </CommandCard>

              {/* 5. Announce Role */}
              <CommandCard icon={<Star className="w-4 h-4 text-yellow-400" />} title="Announce Role" description="Announces a role assignment for a user in chat.">
                <div className="flex gap-2 mb-2">
                  <Input value={announceUser} onChange={e => setAnnounceUser(e.target.value)} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Input value={announceRole} onChange={e => setAnnounceRole(e.target.value)} placeholder="Role title..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                </div>
                <Button size="sm" onClick={() => runCmd(cmd5Fb, () => adminCmds.announceRole(announceUser, announceRole))} className="w-full h-8 text-xs bg-yellow-500/80 hover:bg-yellow-500 text-white border-0">Announce</Button>
                <FeedbackBadge fb={cmd5Fb.feedback} />
              </CommandCard>

              {/* 6. Change Theme */}
              <CommandCard icon={<Palette className="w-4 h-4 text-pink-400" />} title="Change Theme" description="Changes the chat theme for all users.">
                <div className="flex gap-2">
                  <select
                    value={themeChoice}
                    onChange={e => setThemeChoice(e.target.value)}
                    className="flex-1 h-8 text-xs bg-dc-input border border-white/10 text-white rounded-md px-2"
                  >
                    <option value="dark">Dark (Default)</option>
                    <option value="light">Light</option>
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                  </select>
                  <Button size="sm" onClick={() => runCmd(cmd6Fb, () => adminCmds.changeTheme(themeChoice))} className="h-8 px-3 text-xs bg-pink-500/80 hover:bg-pink-500 text-white border-0">Apply</Button>
                </div>
                <FeedbackBadge fb={cmd6Fb.feedback} />
              </CommandCard>

              {/* 13. Fake Join / Leave */}
              <CommandCard icon={<Zap className="w-4 h-4 text-yellow-400" />} title="Fake Join / Leave" description="Sends a fake join or leave notification in chat.">
                <div className="flex gap-2 mb-2">
                  <Input value={fakeJoinUser} onChange={e => setFakeJoinUser(e.target.value)} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd13Fb, () => adminCmds.fakeJoin(fakeJoinUser))} className="h-8 px-3 text-xs bg-green-500/80 hover:bg-green-500 text-white border-0">Join</Button>
                </div>
                <div className="flex gap-2">
                  <Input value={fakeLeaveUser} onChange={e => setFakeLeaveUser(e.target.value)} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd14Fb, () => adminCmds.fakeLeave(fakeLeaveUser))} className="h-8 px-3 text-xs bg-red-500/80 hover:bg-red-500 text-white border-0">Leave</Button>
                </div>
                <FeedbackBadge fb={cmd13Fb.feedback} />
                <FeedbackBadge fb={cmd14Fb.feedback} />
              </CommandCard>

              {/* 15. MOTD */}
              <CommandCard icon={<MessageSquare className="w-4 h-4 text-blue-400" />} title="Message of the Day" description="Sets a banner message shown at the top of chat for all users.">
                <div className="flex gap-2 mb-2">
                  <Input value={motdText} onChange={e => setMotdText(e.target.value)} placeholder="MOTD text..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd15Fb, () => adminCmds.setMOTDCommand(motdText))} className="h-8 px-3 text-xs bg-blue-500/80 hover:bg-blue-500 text-white border-0">Set</Button>
                  <Button size="sm" onClick={() => runCmd(cmd16Fb, adminCmds.clearMOTDCommand)} className="h-8 px-3 text-xs bg-gray-500/80 hover:bg-gray-500 text-white border-0">Clear</Button>
                </div>
                <FeedbackBadge fb={cmd15Fb.feedback} />
                <FeedbackBadge fb={cmd16Fb.feedback} />
              </CommandCard>

              {/* 17. Highlight User */}
              <CommandCard icon={<Star className="w-4 h-4 text-amber-400" />} title="Highlight User" description="Adds a glowing colored border to a user's messages for a duration.">
                <div className="flex gap-2 mb-2">
                  <Input value={highlightUser} onChange={e => setHighlightUser(e.target.value)} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <input type="color" value={highlightColor} onChange={e => setHighlightColor(e.target.value)} className="h-8 w-10 rounded border border-white/10 bg-dc-input cursor-pointer" />
                  <Input value={highlightDuration} onChange={e => setHighlightDuration(e.target.value)} placeholder="Secs..." className="w-16 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                </div>
                <Button size="sm" onClick={() => runCmd(cmd17Fb, () => adminCmds.highlightUser(highlightUser, highlightColor, parseInt(highlightDuration) || 60))} className="w-full h-8 text-xs bg-amber-500/80 hover:bg-amber-500 text-white border-0">Highlight</Button>
                <FeedbackBadge fb={cmd17Fb.feedback} />
              </CommandCard>

              {/* 18. Shadowban */}
              <CommandCard icon={<Ghost className="w-4 h-4 text-gray-400" />} title="Shadowban / Unshadowban" description="Shadowbanned users see their messages locally but they aren't broadcast to others.">
                <div className="flex gap-2 mb-2">
                  <Input value={shadowbanUser} onChange={e => setShadowbanUser(e.target.value)} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd18Fb, () => adminCmds.shadowban(shadowbanUser))} className="h-8 px-3 text-xs bg-gray-500/80 hover:bg-gray-500 text-white border-0"><Eye className="w-3 h-3 mr-1" />Shadow</Button>
                </div>
                <div className="flex gap-2">
                  <Input value={unshadowbanUser} onChange={e => setUnshadowbanUser(e.target.value)} placeholder="Username..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd19Fb, () => adminCmds.unshadowban(unshadowbanUser))} className="h-8 px-3 text-xs bg-teal-500/80 hover:bg-teal-500 text-white border-0"><EyeOff className="w-3 h-3 mr-1" />Unshadow</Button>
                </div>
                <FeedbackBadge fb={cmd18Fb.feedback} />
                <FeedbackBadge fb={cmd19Fb.feedback} />
              </CommandCard>

              {/* 20. Rename Channel */}
              <CommandCard icon={<Hash className="w-4 h-4 text-dc-accent" />} title="Rename Channel" description="Changes the channel name displayed in the header.">
                <div className="flex gap-2">
                  <Input value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="New channel name..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd20Fb, () => adminCmds.renameChannel(channelName))} className="h-8 px-3 text-xs bg-dc-accent/80 hover:bg-dc-accent text-white border-0">Rename</Button>
                </div>
                <FeedbackBadge fb={cmd20Fb.feedback} />
              </CommandCard>

              {/* 21. Set User Limit */}
              <CommandCard icon={<Users className="w-4 h-4 text-purple-400" />} title="Set User Limit" description="Sets the maximum number of users allowed in the chat.">
                <div className="flex gap-2">
                  <Input value={userLimit} onChange={e => setUserLimit(e.target.value)} placeholder="Max users..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd21Fb, () => adminCmds.setUserLimitCommand(parseInt(userLimit) || 100))} className="h-8 px-3 text-xs bg-purple-500/80 hover:bg-purple-500 text-white border-0">Set</Button>
                  <Button size="sm" onClick={() => runCmd(cmd22Fb, adminCmds.resetUserLimit)} className="h-8 px-3 text-xs bg-gray-500/80 hover:bg-gray-500 text-white border-0">Reset</Button>
                </div>
                <FeedbackBadge fb={cmd21Fb.feedback} />
                <FeedbackBadge fb={cmd22Fb.feedback} />
              </CommandCard>

              {/* 23. Toggle Profanity Filter */}
              <CommandCard icon={<Filter className="w-4 h-4 text-green-400" />} title="Toggle Profanity Filter" description="Enables or disables the profanity filter for all users.">
                <Button onClick={() => runCmd(cmd23Fb, adminCmds.toggleProfanityFilter)} className="w-full h-8 text-xs bg-green-500/80 hover:bg-green-500 text-white border-0 gap-1.5">
                  <Filter className="w-3.5 h-3.5" />Toggle Profanity Filter
                </Button>
                <FeedbackBadge fb={cmd23Fb.feedback} />
              </CommandCard>

              {/* 24. Impersonate Bot */}
              <CommandCard icon={<Bot className="w-4 h-4 text-dc-accent" />} title="Impersonate Bot" description="Sends a message as G.AI 🤖 bot.">
                <div className="flex gap-2">
                  <Input value={botMessage} onChange={e => setBotMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && runCmd(cmd24Fb, () => adminCmds.impersonateBot(botMessage))} placeholder="Bot message..." className="flex-1 h-8 text-xs bg-dc-input border-white/10 text-white placeholder:text-dc-muted" />
                  <Button size="sm" onClick={() => runCmd(cmd24Fb, () => adminCmds.impersonateBot(botMessage))} className="h-8 px-3 text-xs bg-dc-accent/80 hover:bg-dc-accent text-white border-0"><Bot className="w-3 h-3 mr-1" />Send</Button>
                </div>
                <FeedbackBadge fb={cmd24Fb.feedback} />
              </CommandCard>

              {/* 25. Export Chat Log */}
              <CommandCard icon={<Download className="w-4 h-4 text-green-400" />} title="Export Chat Log" description="Downloads all chat messages as a JSON file.">
                <Button onClick={() => runCmd(cmd25Fb, adminCmds.exportLog)} className="w-full h-8 text-xs bg-green-500/80 hover:bg-green-500 text-white border-0 gap-1.5">
                  <Download className="w-3.5 h-3.5" />Download Chat Log
                </Button>
                <FeedbackBadge fb={cmd25Fb.feedback} />
              </CommandCard>
            </TabsContent>

            {/* ── Bans Tab ── */}
            <TabsContent value="bans" className="flex-1 overflow-y-auto mt-0 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-dc-muted font-semibold uppercase tracking-wide">Active Bans ({bans.length})</span>
                <Button size="sm" variant="ghost" onClick={refresh} className="h-6 px-2 text-xs text-dc-muted hover:text-white">
                  <RefreshCw className="w-3 h-3 mr-1" />Refresh
                </Button>
              </div>

              {bans.length === 0 ? (
                <div className="text-center py-8 text-dc-muted text-sm">No active bans.</div>
              ) : (
                bans.map(ban => (
                  <div key={ban.username} className="bg-dc-bg/50 rounded-xl p-3 border border-red-500/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <Ban className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{ban.username}</p>
                      <p className="text-dc-muted text-xs">{formatTimeRemaining(ban.expiresAt)} remaining</p>
                    </div>
                    <Button size="sm" onClick={() => handleUnban(ban.username)} className="h-7 px-2 text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/20">
                      <UserCheck className="w-3 h-3 mr-1" />Unban
                    </Button>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between mt-4 mb-1">
                <span className="text-xs text-dc-muted font-semibold uppercase tracking-wide">Active Mutes ({mutes.length})</span>
              </div>

              {mutes.length === 0 ? (
                <div className="text-center py-4 text-dc-muted text-sm">No active mutes.</div>
              ) : (
                mutes.map(mute => (
                  <div key={mute.username} className="bg-dc-bg/50 rounded-xl p-3 border border-orange-500/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                      <VolumeX className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{mute.username}</p>
                      <p className="text-dc-muted text-xs">{formatTimeRemaining(mute.expiresAt)} remaining</p>
                    </div>
                  </div>
                ))
              )}

              <div className="flex items-center justify-between mt-4 mb-1">
                <span className="text-xs text-dc-muted font-semibold uppercase tracking-wide">Mod Log ({modLog.length})</span>
                <Button size="sm" variant="ghost" onClick={handleClearLog} className="h-6 px-2 text-xs text-dc-muted hover:text-red-400">
                  <Trash2 className="w-3 h-3 mr-1" />Clear
                </Button>
              </div>

              {modLog.length === 0 ? (
                <div className="text-center py-4 text-dc-muted text-sm">No moderation events.</div>
              ) : (
                modLog.map(entry => (
                  <div key={entry.id} className="bg-dc-bg/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold">{entry.username}</p>
                        <p className="text-dc-muted text-xs truncate">{entry.message}</p>
                        <p className="text-red-400/70 text-xs mt-0.5">{entry.reason}</p>
                      </div>
                      <span className="text-dc-muted text-[10px] shrink-0">{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
