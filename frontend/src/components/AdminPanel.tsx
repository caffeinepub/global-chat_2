import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ChatMessage } from '../types/chat';
import { useFunCommands } from '../hooks/useFunCommands';
import { getModLog, ModLogEntry } from '../lib/modLog';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUsername: string;
  sendMessage: (msg: ChatMessage) => void;
  onAdminSend: (text: string, isBig: boolean) => void;
}

function StatusMsg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <p className={`text-xs mt-1 ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
  );
}

type Status = { text: string; ok: boolean } | null;

export default function AdminPanel({ open, onClose, currentUsername, sendMessage, onAdminSend }: Props) {
  const cmds = useFunCommands(sendMessage, currentUsername);

  // Big message
  const [bigText, setBigText] = useState('');
  const [bigStatus, setBigStatus] = useState<Status>(null);

  // Force text
  const [forceTarget, setForceTarget] = useState('');
  const [forceText, setForceText] = useState('');
  const [forceStatus, setForceStatus] = useState<Status>(null);

  // Ghost mode
  const [ghostUser, setGhostUser] = useState('');
  const [ghostDur, setGhostDur] = useState('5');
  const [ghostStatus, setGhostStatus] = useState<Status>(null);

  // VIP
  const [vipUser, setVipUser] = useState('');
  const [vipStatus, setVipStatus] = useState<Status>(null);
  const [removeVipUser, setRemoveVipUser] = useState('');
  const [removeVipStatus, setRemoveVipStatus] = useState<Status>(null);

  // Freeze
  const [freezeUserInput, setFreezeUserInput] = useState('');
  const [freezeDur, setFreezeDur] = useState('5');
  const [freezeStatus, setFreezeStatus] = useState<Status>(null);
  const [unfreezeUserInput, setUnfreezeUserInput] = useState('');
  const [unfreezeStatus, setUnfreezeStatus] = useState<Status>(null);

  // Balloon
  const [balloonText, setBalloonText] = useState('');
  const [balloonStatus, setBalloonStatus] = useState<Status>(null);

  // Weather
  const [weatherPreset, setWeatherPreset] = useState('sunny');
  const [weatherStatus, setWeatherStatus] = useState<Status>(null);

  // Avatar color
  const [avatarUser, setAvatarUser] = useState('');
  const [avatarColor, setAvatarColor] = useState('#ff6b6b');
  const [avatarStatus, setAvatarStatus] = useState<Status>(null);
  const [resetAvatarUser, setResetAvatarUser] = useState('');
  const [resetAvatarStatus, setResetAvatarStatus] = useState<Status>(null);

  // Spotlight
  const [spotlightUserInput, setSpotlightUserInput] = useState('');
  const [spotlightStatus, setSpotlightStatus] = useState<Status>(null);

  // Nickname
  const [nickUser, setNickUser] = useState('');
  const [nickName, setNickName] = useState('');
  const [nickStatus, setNickStatus] = useState<Status>(null);
  const [removeNickUser, setRemoveNickUser] = useState('');
  const [removeNickStatus, setRemoveNickStatus] = useState<Status>(null);

  // Trivia
  const [triviaQ, setTriviaQ] = useState('');
  const [triviaOpts, setTriviaOpts] = useState(['', '', '', '']);
  const [triviaStatus, setTriviaStatus] = useState<Status>(null);

  // Word of the day
  const [wotdWord, setWotdWord] = useState('');
  const [wotdDef, setWotdDef] = useState('');
  const [wotdStatus, setWotdStatus] = useState<Status>(null);

  // Message count
  const [msgCount, setMsgCount] = useState<number | null>(null);

  // Mod log
  const [modLog, setModLog] = useState<ModLogEntry[]>([]);
  const [logStatus, setLogStatus] = useState<Status>(null);

  // Generic status for instant commands
  const [instantStatus, setInstantStatus] = useState<Record<string, Status>>({});

  useEffect(() => {
    if (open) setModLog(getModLog());
  }, [open]);

  const setInstant = (key: string, text: string, ok: boolean) => {
    setInstantStatus((prev) => ({ ...prev, [key]: { text, ok } }));
    setTimeout(() => setInstantStatus((prev) => ({ ...prev, [key]: null })), 3000);
  };

  const handleInstant = (key: string, fn: () => void) => {
    fn();
    setInstant(key, '✅ Done!', true);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-dc-sidebar border-l border-white/10 text-white p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-yellow-400 text-xl font-bold flex items-center gap-2">
            👑 Admin Panel
          </SheetTitle>
          <SheetDescription className="text-dc-muted text-sm">
            AI.Caffeine exclusive controls
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="fun" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mb-2 bg-dc-bg/50 shrink-0">
            <TabsTrigger value="fun" className="flex-1 text-xs">🎮 Fun Commands</TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 text-xs">📢 Broadcast</TabsTrigger>
            <TabsTrigger value="log" className="flex-1 text-xs">📋 Log</TabsTrigger>
          </TabsList>

          {/* FUN COMMANDS TAB */}
          <TabsContent value="fun" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-2">

                {/* Section: Visual Effects */}
                <div>
                  <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider mb-2">✨ Visual Effects</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Button size="sm" className="w-full bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 text-white text-xs"
                        onClick={() => handleInstant('rainbow', cmds.rainbowMode)}>
                        🌈 Rainbow Mode
                      </Button>
                      <StatusMsg msg={instantStatus['rainbow'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-xs"
                        onClick={() => handleInstant('confetti', cmds.confettiBlast)}>
                        🎉 Confetti Blast
                      </Button>
                      <StatusMsg msg={instantStatus['confetti'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                        onClick={() => handleInstant('flip', cmds.flipChat)}>
                        🙃 Flip Chat
                      </Button>
                      <StatusMsg msg={instantStatus['flip'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs"
                        onClick={() => handleInstant('shake', cmds.shakeMessages)}>
                        📳 Shake Messages
                      </Button>
                      <StatusMsg msg={instantStatus['shake'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        onClick={() => handleInstant('bighead', cmds.bigHeadMode)}>
                        🗿 Big Head Mode
                      </Button>
                      <StatusMsg msg={instantStatus['bighead'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-pink-600 hover:bg-pink-700 text-white text-xs"
                        onClick={() => handleInstant('party', cmds.partyMode)}>
                        🥳 Party Mode
                      </Button>
                      <StatusMsg msg={instantStatus['party'] ?? null} />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Section: Themes */}
                <div>
                  <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider mb-2">🎨 Themes</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Button size="sm" className="w-full bg-green-500 hover:bg-green-600 text-black text-xs"
                        onClick={() => handleInstant('neon', cmds.neonTheme)}>
                        💚 Neon
                      </Button>
                      <StatusMsg msg={instantStatus['neon'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs"
                        onClick={() => handleInstant('retro', cmds.retroTheme)}>
                        📺 Retro
                      </Button>
                      <StatusMsg msg={instantStatus['retro'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-dc-accent hover:bg-dc-accent/80 text-white text-xs"
                        onClick={() => handleInstant('resetTheme', cmds.resetTheme)}>
                        🔄 Reset
                      </Button>
                      <StatusMsg msg={instantStatus['resetTheme'] ?? null} />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Section: User Commands */}
                <div>
                  <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider mb-2">👤 User Commands</p>
                  <div className="space-y-3">

                    {/* Ghost Mode */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">👻 Ghost Mode</p>
                      <Input placeholder="Username" value={ghostUser} onChange={(e) => setGhostUser(e.target.value)}
                        className="h-7 text-xs bg-dc-bg border-white/20 text-white" />
                      <div className="flex gap-2">
                        <Input placeholder="Minutes (default 5)" value={ghostDur} onChange={(e) => setGhostDur(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" type="number" min="1" />
                        <Button size="sm" className="h-7 text-xs bg-gray-600 hover:bg-gray-700"
                          onClick={() => {
                            const err = cmds.ghostMode(ghostUser, parseInt(ghostDur) || 5);
                            setGhostStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setGhostUser('');
                          }}>Apply</Button>
                      </div>
                      <StatusMsg msg={ghostStatus} />
                    </div>

                    {/* VIP Crown */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">👑 VIP Crown</p>
                      <div className="flex gap-2">
                        <Input placeholder="Give VIP to..." value={vipUser} onChange={(e) => setVipUser(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-yellow-500 hover:bg-yellow-600 text-black"
                          onClick={() => {
                            const err = cmds.giveVIP(vipUser);
                            setVipStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setVipUser('');
                          }}>Give</Button>
                      </div>
                      <StatusMsg msg={vipStatus} />
                      <div className="flex gap-2">
                        <Input placeholder="Remove VIP from..." value={removeVipUser} onChange={(e) => setRemoveVipUser(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-red-700 hover:bg-red-800"
                          onClick={() => {
                            const err = cmds.removeVIP(removeVipUser);
                            setRemoveVipStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setRemoveVipUser('');
                          }}>Remove</Button>
                      </div>
                      <StatusMsg msg={removeVipStatus} />
                    </div>

                    {/* Freeze User */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🧊 Freeze / Unfreeze</p>
                      <div className="flex gap-2">
                        <Input placeholder="Freeze username" value={freezeUserInput} onChange={(e) => setFreezeUserInput(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Input placeholder="Min" value={freezeDur} onChange={(e) => setFreezeDur(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white w-16" type="number" min="1" />
                        <Button size="sm" className="h-7 text-xs bg-cyan-700 hover:bg-cyan-800"
                          onClick={() => {
                            const err = cmds.freezeUser(freezeUserInput, parseInt(freezeDur) || 5);
                            setFreezeStatus(err ? { text: err, ok: false } : { text: '✅ Frozen!', ok: true });
                            if (!err) setFreezeUserInput('');
                          }}>Freeze</Button>
                      </div>
                      <StatusMsg msg={freezeStatus} />
                      <div className="flex gap-2">
                        <Input placeholder="Unfreeze username" value={unfreezeUserInput} onChange={(e) => setUnfreezeUserInput(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            const err = cmds.unfreezeUser(unfreezeUserInput);
                            setUnfreezeStatus(err ? { text: err, ok: false } : { text: '✅ Unfrozen!', ok: true });
                            if (!err) setUnfreezeUserInput('');
                          }}>Unfreeze</Button>
                      </div>
                      <StatusMsg msg={unfreezeStatus} />
                    </div>

                    {/* Spotlight */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🔦 Spotlight User</p>
                      <div className="flex gap-2">
                        <Input placeholder="Username" value={spotlightUserInput} onChange={(e) => setSpotlightUserInput(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700"
                          onClick={() => {
                            const err = cmds.spotlightUser(spotlightUserInput);
                            setSpotlightStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setSpotlightUserInput('');
                          }}>Spotlight</Button>
                      </div>
                      <StatusMsg msg={spotlightStatus} />
                    </div>

                    {/* Nickname */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🏷️ Random Nickname</p>
                      <Input placeholder="Username" value={nickUser} onChange={(e) => setNickUser(e.target.value)}
                        className="h-7 text-xs bg-dc-bg border-white/20 text-white" />
                      <div className="flex gap-2">
                        <Input placeholder="Nickname" value={nickName} onChange={(e) => setNickName(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {
                            const err = cmds.randomNickname(nickUser, nickName);
                            setNickStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) { setNickUser(''); setNickName(''); }
                          }}>Set</Button>
                      </div>
                      <StatusMsg msg={nickStatus} />
                      <div className="flex gap-2">
                        <Input placeholder="Remove nickname from..." value={removeNickUser} onChange={(e) => setRemoveNickUser(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-red-700 hover:bg-red-800"
                          onClick={() => {
                            const err = cmds.removeNickname(removeNickUser);
                            setRemoveNickStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setRemoveNickUser('');
                          }}>Remove</Button>
                      </div>
                      <StatusMsg msg={removeNickStatus} />
                    </div>

                    {/* Avatar Color */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🎨 Avatar Color</p>
                      <div className="flex gap-2">
                        <Input placeholder="Username" value={avatarUser} onChange={(e) => setAvatarUser(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <input type="color" value={avatarColor} onChange={(e) => setAvatarColor(e.target.value)}
                          className="h-7 w-10 rounded cursor-pointer border border-white/20 bg-transparent" />
                        <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            const err = cmds.changeAvatarColor(avatarUser, avatarColor);
                            setAvatarStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setAvatarUser('');
                          }}>Set</Button>
                      </div>
                      <StatusMsg msg={avatarStatus} />
                      <div className="flex gap-2">
                        <Input placeholder="Reset color for..." value={resetAvatarUser} onChange={(e) => setResetAvatarUser(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-gray-600 hover:bg-gray-700"
                          onClick={() => {
                            const err = cmds.resetAvatarColor(resetAvatarUser);
                            setResetAvatarStatus(err ? { text: err, ok: false } : { text: '✅ Done!', ok: true });
                            if (!err) setResetAvatarUser('');
                          }}>Reset</Button>
                      </div>
                      <StatusMsg msg={resetAvatarStatus} />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Section: Fun Announcements */}
                <div>
                  <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider mb-2">📣 Announcements</p>
                  <div className="space-y-3">

                    {/* Balloon Message */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🎈 Balloon Message</p>
                      <div className="flex gap-2">
                        <Input placeholder="Your message..." value={balloonText} onChange={(e) => setBalloonText(e.target.value)}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white flex-1" />
                        <Button size="sm" className="h-7 text-xs bg-pink-500 hover:bg-pink-600"
                          onClick={() => {
                            const err = cmds.balloonMessage(balloonText);
                            setBalloonStatus(err ? { text: err, ok: false } : { text: '✅ Sent!', ok: true });
                            if (!err) setBalloonText('');
                          }}>Send</Button>
                      </div>
                      <StatusMsg msg={balloonStatus} />
                    </div>

                    {/* Weather Announce */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🌤️ Weather Announce</p>
                      <div className="flex gap-2">
                        <select value={weatherPreset} onChange={(e) => setWeatherPreset(e.target.value)}
                          className="flex-1 h-7 text-xs bg-dc-bg border border-white/20 text-white rounded px-2">
                          <option value="sunny">☀️ Sunny</option>
                          <option value="rainy">🌧️ Rainy</option>
                          <option value="snowy">❄️ Snowy</option>
                          <option value="stormy">⛈️ Stormy</option>
                          <option value="cloudy">☁️ Cloudy</option>
                          <option value="windy">💨 Windy</option>
                          <option value="rainbow">🌈 Rainbow</option>
                          <option value="foggy">🌫️ Foggy</option>
                        </select>
                        <Button size="sm" className="h-7 text-xs bg-sky-600 hover:bg-sky-700"
                          onClick={() => {
                            cmds.weatherAnnounce(weatherPreset);
                            setWeatherStatus({ text: '✅ Announced!', ok: true });
                          }}>Announce</Button>
                      </div>
                      <StatusMsg msg={weatherStatus} />
                    </div>

                    {/* Trivia */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">🧠 Trivia Question</p>
                      <Input placeholder="Question..." value={triviaQ} onChange={(e) => setTriviaQ(e.target.value)}
                        className="h-7 text-xs bg-dc-bg border-white/20 text-white" />
                      {triviaOpts.map((opt, i) => (
                        <Input key={i} placeholder={`Option ${['A', 'B', 'C', 'D'][i]}...`} value={opt}
                          onChange={(e) => {
                            const updated = [...triviaOpts];
                            updated[i] = e.target.value;
                            setTriviaOpts(updated);
                          }}
                          className="h-7 text-xs bg-dc-bg border-white/20 text-white" />
                      ))}
                      <Button size="sm" className="w-full h-7 text-xs bg-teal-600 hover:bg-teal-700"
                        onClick={() => {
                          const err = cmds.triviaQuestion(triviaQ, triviaOpts);
                          setTriviaStatus(err ? { text: err, ok: false } : { text: '✅ Posted!', ok: true });
                          if (!err) { setTriviaQ(''); setTriviaOpts(['', '', '', '']); }
                        }}>Post Trivia</Button>
                      <StatusMsg msg={triviaStatus} />
                    </div>

                    {/* Word of the Day */}
                    <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-white">📖 Word of the Day</p>
                      <Input placeholder="Word..." value={wotdWord} onChange={(e) => setWotdWord(e.target.value)}
                        className="h-7 text-xs bg-dc-bg border-white/20 text-white" />
                      <Textarea placeholder="Definition..." value={wotdDef} onChange={(e) => setWotdDef(e.target.value)}
                        className="text-xs bg-dc-bg border-white/20 text-white resize-none h-16" />
                      <Button size="sm" className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          const err = cmds.wordOfTheDay(wotdWord, wotdDef);
                          setWotdStatus(err ? { text: err, ok: false } : { text: '✅ Posted!', ok: true });
                          if (!err) { setWotdWord(''); setWotdDef(''); }
                        }}>Post Word</Button>
                      <StatusMsg msg={wotdStatus} />
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Section: Instant Fun */}
                <div>
                  <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider mb-2">⚡ Instant Fun</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs"
                        onClick={() => handleInstant('summon', cmds.summonBot)}>
                        🤖 Summon Bot
                      </Button>
                      <StatusMsg msg={instantStatus['summon'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs"
                        onClick={() => handleInstant('birthday', cmds.serverBirthday)}>
                        🎂 Server Birthday
                      </Button>
                      <StatusMsg msg={instantStatus['birthday'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs"
                        onClick={() => handleInstant('mystery', cmds.mysteryBox)}>
                        🎁 Mystery Box
                      </Button>
                      <StatusMsg msg={instantStatus['mystery'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-slate-600 hover:bg-slate-700 text-white text-xs"
                        onClick={() => handleInstant('typing', cmds.typingFlood)}>
                        ⌨️ Typing Flood
                      </Button>
                      <StatusMsg msg={instantStatus['typing'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs"
                        onClick={() => {
                          cmds.serverStats();
                          setInstant('stats', '✅ Stats posted!', true);
                        }}>
                        📊 Server Stats
                      </Button>
                      <StatusMsg msg={instantStatus['stats'] ?? null} />
                    </div>
                    <div>
                      <Button size="sm" className="w-full bg-dc-bg hover:bg-dc-bg/80 border border-white/20 text-white text-xs"
                        onClick={() => {
                          const count = cmds.countMessages();
                          setMsgCount(count);
                        }}>
                        💬 Count Messages
                      </Button>
                      {msgCount !== null && (
                        <p className="text-xs mt-1 text-green-400">💬 {msgCount} messages in cache</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* Clear Admin Log */}
                <div>
                  <p className="text-xs font-semibold text-dc-muted uppercase tracking-wider mb-2">🗑️ Maintenance</p>
                  <Button size="sm" className="w-full bg-red-900 hover:bg-red-800 text-white text-xs"
                    onClick={() => {
                      cmds.clearAdminLog();
                      setModLog([]);
                      setLogStatus({ text: '✅ Admin log cleared!', ok: true });
                    }}>
                    🗑️ Clear Admin Log
                  </Button>
                  <StatusMsg msg={logStatus} />
                </div>

              </div>
            </ScrollArea>
          </TabsContent>

          {/* BROADCAST TAB */}
          <TabsContent value="broadcast" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-2">
                {/* Big Message */}
                <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-white">📢 Big Announcement</p>
                  <Textarea
                    placeholder="Type your announcement..."
                    value={bigText}
                    onChange={(e) => setBigText(e.target.value)}
                    className="text-sm bg-dc-bg border-white/20 text-white resize-none h-20"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                    onClick={() => {
                      if (!bigText.trim()) {
                        setBigStatus({ text: 'Please enter a message', ok: false });
                        return;
                      }
                      onAdminSend(bigText.trim(), true);
                      setBigText('');
                      setBigStatus({ text: '✅ Announcement sent!', ok: true });
                    }}
                  >
                    📢 Send Announcement
                  </Button>
                  <StatusMsg msg={bigStatus} />
                </div>

                {/* Force Text */}
                <div className="bg-dc-bg/40 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-white">👻 Force Text (as user)</p>
                  <Input
                    placeholder="Target username"
                    value={forceTarget}
                    onChange={(e) => setForceTarget(e.target.value)}
                    className="h-8 text-sm bg-dc-bg border-white/20 text-white"
                  />
                  <Textarea
                    placeholder="Message to force..."
                    value={forceText}
                    onChange={(e) => setForceText(e.target.value)}
                    className="text-sm bg-dc-bg border-white/20 text-white resize-none h-16"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      if (!forceTarget.trim() || !forceText.trim()) {
                        setForceStatus({ text: 'Please fill in both fields', ok: false });
                        return;
                      }
                      const forcedMsg: ChatMessage = {
                        id: `forced-${Date.now()}`,
                        username: forceTarget.trim(),
                        text: forceText.trim(),
                        timestamp: Date.now(),
                        isBigMessage: false,
                        isForced: true,
                        isBot: false,
                        isSystem: false,
                        isBroadcast: false,
                      };
                      sendMessage(forcedMsg);
                      setForceTarget('');
                      setForceText('');
                      setForceStatus({ text: '✅ Force text sent!', ok: true });
                    }}
                  >
                    👻 Force Send
                  </Button>
                  <StatusMsg msg={forceStatus} />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* LOG TAB */}
          <TabsContent value="log" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="pt-2 space-y-2">
                {modLog.length === 0 ? (
                  <p className="text-dc-muted text-sm text-center py-8">No log entries</p>
                ) : (
                  modLog.map((entry, i) => (
                    <div key={i} className="bg-dc-bg/40 rounded p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-red-400 font-semibold">{entry.username}</span>
                        <span className="text-dc-muted">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-white/70">{entry.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
