import { useCallback } from 'react';
import type { ChatMessage } from '../types/chat';

const CHANNEL = 'globalchat_server_control';

function broadcast(type: string, payload?: Record<string, unknown>) {
  const ch = new BroadcastChannel(CHANNEL);
  ch.postMessage({ type, payload, ts: Date.now() });
  ch.close();
}

function setWithExpiry(key: string, value: unknown, ttlMs: number) {
  localStorage.setItem(key, JSON.stringify({ value, expiry: Date.now() + ttlMs }));
}

function getWithExpiry<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value as T;
  } catch {
    return null;
  }
}

const BOT_FACTS = [
  "🤖 Fun fact: Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs!",
  "🤖 Did you know? Octopuses have three hearts and blue blood!",
  "🤖 Joke: Why don't scientists trust atoms? Because they make up everything! 😄",
  "🤖 Fun fact: A group of flamingos is called a 'flamboyance'!",
  "🤖 Joke: I told my wife she was drawing her eyebrows too high. She looked surprised! 😂",
  "🤖 Fun fact: Bananas are berries, but strawberries are not!",
  "🤖 Joke: Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
  "🤖 Fun fact: The shortest war in history lasted only 38–45 minutes (Anglo-Zanzibar War, 1896)!",
  "🤖 Joke: What do you call fake spaghetti? An impasta! 🍝",
  "🤖 Fun fact: Cows have best friends and get stressed when separated from them! 🐄",
];

const MYSTERY_MESSAGES = [
  "🎁 Mystery Box opened! Everyone gets +100 good vibes!",
  "🎲 Mystery Box: The server is now officially cursed with good luck!",
  "🃏 Mystery Box: A wild party has appeared!",
  "🌟 Mystery Box: You found a golden ticket! Congratulations to everyone!",
  "🦄 Mystery Box: Unicorns are now real. You're welcome.",
  "🍕 Mystery Box: Free pizza for everyone! (Imaginary pizza, but still!)",
  "🚀 Mystery Box: The server has been launched into space!",
  "🎭 Mystery Box: Everyone is now a VIP for the next 5 minutes!",
];

const WEATHER_PRESETS: Record<string, string> = {
  sunny: "☀️ Weather Update: It's a beautiful sunny day! Perfect for chatting!",
  rainy: "🌧️ Weather Update: It's raining outside! Cozy up and enjoy the chat!",
  snowy: "❄️ Weather Update: Snow is falling! Stay warm and keep chatting!",
  stormy: "⛈️ Weather Update: There's a storm brewing! Stay safe inside!",
  cloudy: "☁️ Weather Update: Cloudy skies today, but the chat is always bright!",
  windy: "💨 Weather Update: It's super windy out there! Hold onto your hats!",
  rainbow: "🌈 Weather Update: A rainbow appeared after the rain! How magical!",
  foggy: "🌫️ Weather Update: Foggy conditions today — mysterious vibes only!",
};

export function useFunCommands(
  sendMessage: (msg: ChatMessage) => void,
  currentUsername: string
) {
  const makeSystemMsg = useCallback(
    (text: string, extra?: Partial<ChatMessage>): ChatMessage => ({
      id: `fun-${Date.now()}-${Math.random()}`,
      username: 'G.AI 🤖',
      text,
      timestamp: Date.now(),
      isBigMessage: false,
      isForced: false,
      isBot: true,
      isSystem: true,
      isBroadcast: true,
      ...extra,
    }),
    []
  );

  // 1. Rainbow Mode
  const rainbowMode = useCallback(() => {
    setWithExpiry('globalchat_rainbow_mode', true, 60_000);
    broadcast('rainbow_mode', { active: true, expiry: Date.now() + 60_000 });
    sendMessage(makeSystemMsg('🌈 Rainbow Mode activated for 60 seconds!'));
  }, [sendMessage, makeSystemMsg]);

  // 2. Confetti Blast
  const confettiBlast = useCallback(() => {
    broadcast('confetti_blast');
    sendMessage(makeSystemMsg('🎉 CONFETTI BLAST! 🎊'));
  }, [sendMessage, makeSystemMsg]);

  // 3. Flip Chat
  const flipChat = useCallback(() => {
    setWithExpiry('globalchat_flip_mode', true, 30_000);
    broadcast('flip_mode', { active: true, expiry: Date.now() + 30_000 });
    sendMessage(makeSystemMsg('🙃 Chat has been flipped for 30 seconds!'));
  }, [sendMessage, makeSystemMsg]);

  // 4. Shake Messages
  const shakeMessages = useCallback(() => {
    setWithExpiry('globalchat_shake_mode', true, 10_000);
    broadcast('shake_mode', { active: true, expiry: Date.now() + 10_000 });
    sendMessage(makeSystemMsg('📳 Messages are shaking for 10 seconds!'));
  }, [sendMessage, makeSystemMsg]);

  // 5. Big Head Mode
  const bigHeadMode = useCallback(() => {
    setWithExpiry('globalchat_bighead', true, 60_000);
    broadcast('bighead_mode', { active: true, expiry: Date.now() + 60_000 });
    sendMessage(makeSystemMsg('🗿 Big Head Mode activated for 60 seconds!'));
  }, [sendMessage, makeSystemMsg]);

  // 6. Ghost Mode
  const ghostMode = useCallback(
    (username: string, durationMin: number): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const ghosts: Record<string, number> = JSON.parse(
        localStorage.getItem('globalchat_ghost_users') || '{}'
      );
      ghosts[username.trim()] = Date.now() + durationMin * 60_000;
      localStorage.setItem('globalchat_ghost_users', JSON.stringify(ghosts));
      broadcast('ghost_mode', { username: username.trim(), expiry: ghosts[username.trim()] });
      sendMessage(makeSystemMsg(`👻 ${username.trim()} is now in Ghost Mode for ${durationMin} minutes!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 7. VIP Crown
  const giveVIP = useCallback(
    (username: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const vips: string[] = JSON.parse(localStorage.getItem('globalchat_vip_users') || '[]');
      if (!vips.includes(username.trim())) vips.push(username.trim());
      localStorage.setItem('globalchat_vip_users', JSON.stringify(vips));
      broadcast('vip_update', { vips });
      sendMessage(makeSystemMsg(`👑 ${username.trim()} has been crowned VIP!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 8. Remove VIP
  const removeVIP = useCallback(
    (username: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const vips: string[] = JSON.parse(localStorage.getItem('globalchat_vip_users') || '[]');
      const updated = vips.filter((u) => u !== username.trim());
      localStorage.setItem('globalchat_vip_users', JSON.stringify(updated));
      broadcast('vip_update', { vips: updated });
      sendMessage(makeSystemMsg(`👑 ${username.trim()}'s VIP status has been removed.`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 9. Party Mode
  const partyMode = useCallback(() => {
    setWithExpiry('globalchat_party_mode', true, 60_000);
    broadcast('party_mode', { active: true, expiry: Date.now() + 60_000 });
    sendMessage(makeSystemMsg('🎉 PARTY MODE activated for 60 seconds! 🥳'));
  }, [sendMessage, makeSystemMsg]);

  // 10. Freeze User
  const freezeUser = useCallback(
    (username: string, durationMin: number): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const frozen: Record<string, number> = JSON.parse(
        localStorage.getItem('globalchat_frozen') || '{}'
      );
      frozen[username.trim()] = Date.now() + durationMin * 60_000;
      localStorage.setItem('globalchat_frozen', JSON.stringify(frozen));
      broadcast('freeze_update', { username: username.trim(), expiry: frozen[username.trim()] });
      sendMessage(makeSystemMsg(`🧊 ${username.trim()} has been frozen for ${durationMin} minutes!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 11. Unfreeze User
  const unfreezeUser = useCallback(
    (username: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const frozen: Record<string, number> = JSON.parse(
        localStorage.getItem('globalchat_frozen') || '{}'
      );
      delete frozen[username.trim()];
      localStorage.setItem('globalchat_frozen', JSON.stringify(frozen));
      broadcast('freeze_update', { username: username.trim(), expiry: 0 });
      sendMessage(makeSystemMsg(`🔥 ${username.trim()} has been unfrozen!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 12. Balloon Message
  const balloonMessage = useCallback(
    (text: string): string | null => {
      if (!text.trim()) return 'Please enter a message';
      sendMessage(makeSystemMsg(`🎈 ${text.trim()} 🎈`, { isBigMessage: true }));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 13. Summon Bot
  const summonBot = useCallback(() => {
    const fact = BOT_FACTS[Math.floor(Math.random() * BOT_FACTS.length)];
    sendMessage(makeSystemMsg(fact));
  }, [sendMessage, makeSystemMsg]);

  // 14. Weather Announce
  const weatherAnnounce = useCallback(
    (preset: string) => {
      const msg = WEATHER_PRESETS[preset] || '🌤️ Weather Update: Conditions unknown!';
      sendMessage(makeSystemMsg(msg, { isBigMessage: true }));
    },
    [sendMessage, makeSystemMsg]
  );

  // 15. Change Avatar Color
  const changeAvatarColor = useCallback(
    (username: string, color: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const colors: Record<string, string> = JSON.parse(
        localStorage.getItem('globalchat_avatar_colors') || '{}'
      );
      colors[username.trim()] = color;
      localStorage.setItem('globalchat_avatar_colors', JSON.stringify(colors));
      broadcast('avatar_color_update', { username: username.trim(), color });
      sendMessage(makeSystemMsg(`🎨 ${username.trim()}'s avatar color has been changed!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 16. Reset Avatar Color
  const resetAvatarColor = useCallback(
    (username: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const colors: Record<string, string> = JSON.parse(
        localStorage.getItem('globalchat_avatar_colors') || '{}'
      );
      delete colors[username.trim()];
      localStorage.setItem('globalchat_avatar_colors', JSON.stringify(colors));
      broadcast('avatar_color_update', { username: username.trim(), color: null });
      sendMessage(makeSystemMsg(`🎨 ${username.trim()}'s avatar color has been reset!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 17. Neon Theme
  const neonTheme = useCallback(() => {
    localStorage.setItem('globalchat_theme', 'neon');
    broadcast('theme_change', { theme: 'neon' });
    sendMessage(makeSystemMsg('💚 Neon Theme activated! Eyes up!'));
  }, [sendMessage, makeSystemMsg]);

  // 18. Retro Theme
  const retroTheme = useCallback(() => {
    localStorage.setItem('globalchat_theme', 'retro');
    broadcast('theme_change', { theme: 'retro' });
    sendMessage(makeSystemMsg('📺 Retro Theme activated! Groovy!'));
  }, [sendMessage, makeSystemMsg]);

  // 19. Reset Theme
  const resetTheme = useCallback(() => {
    localStorage.setItem('globalchat_theme', 'default');
    broadcast('theme_change', { theme: 'default' });
    sendMessage(makeSystemMsg('🔄 Theme has been reset to default!'));
  }, [sendMessage, makeSystemMsg]);

  // 20. Spotlight User
  const spotlightUser = useCallback(
    (username: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      broadcast('spotlight', { username: username.trim() });
      sendMessage(makeSystemMsg(`🔦 Spotlight on ${username.trim()}! Everyone say hi! 👋`, { isBigMessage: true }));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 21. Random Nickname
  const randomNickname = useCallback(
    (username: string, nickname: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      if (!nickname.trim()) return 'Please enter a nickname';
      const nicknames: Record<string, { nick: string; expiry: number }> = JSON.parse(
        localStorage.getItem('globalchat_nicknames') || '{}'
      );
      nicknames[username.trim()] = { nick: nickname.trim(), expiry: Date.now() + 10 * 60_000 };
      localStorage.setItem('globalchat_nicknames', JSON.stringify(nicknames));
      broadcast('nickname_update', { username: username.trim(), nickname: nickname.trim() });
      sendMessage(makeSystemMsg(`🏷️ ${username.trim()} is now known as [${nickname.trim()}] for 10 minutes!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 22. Remove Nickname
  const removeNickname = useCallback(
    (username: string): string | null => {
      if (!username.trim()) return 'Please enter a username';
      const nicknames: Record<string, { nick: string; expiry: number }> = JSON.parse(
        localStorage.getItem('globalchat_nicknames') || '{}'
      );
      delete nicknames[username.trim()];
      localStorage.setItem('globalchat_nicknames', JSON.stringify(nicknames));
      broadcast('nickname_update', { username: username.trim(), nickname: null });
      sendMessage(makeSystemMsg(`🏷️ ${username.trim()}'s nickname has been removed!`));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 23. Server Birthday
  const serverBirthday = useCallback(() => {
    broadcast('server_birthday');
    sendMessage(makeSystemMsg('🎂 HAPPY BIRTHDAY! 🎉🎊🎈 Celebrate!', { isBigMessage: true }));
  }, [sendMessage, makeSystemMsg]);

  // 24. Trivia Question
  const triviaQuestion = useCallback(
    (question: string, options: string[]): string | null => {
      if (!question.trim()) return 'Please enter a question';
      const opts = options.filter((o) => o.trim());
      if (opts.length < 2) return 'Please enter at least 2 options';
      const optText = opts.map((o, i) => `${['A', 'B', 'C', 'D'][i]}) ${o}`).join(' | ');
      sendMessage(makeSystemMsg(`🧠 TRIVIA: ${question.trim()}\n${optText}`, { isBigMessage: true }));
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 25. Count Messages
  const countMessages = useCallback((): number => {
    const raw = localStorage.getItem('globalchat_messages');
    if (!raw) return 0;
    try {
      const msgs = JSON.parse(raw);
      return Array.isArray(msgs) ? msgs.length : 0;
    } catch {
      return 0;
    }
  }, []);

  // 26. Word of the Day
  const wordOfTheDay = useCallback(
    (word: string, definition: string): string | null => {
      if (!word.trim()) return 'Please enter a word';
      if (!definition.trim()) return 'Please enter a definition';
      sendMessage(
        makeSystemMsg(`📖 WORD OF THE DAY: "${word.trim()}"\n${definition.trim()}`, { isBigMessage: true })
      );
      return null;
    },
    [sendMessage, makeSystemMsg]
  );

  // 27. Mystery Box
  const mysteryBox = useCallback(() => {
    const msg = MYSTERY_MESSAGES[Math.floor(Math.random() * MYSTERY_MESSAGES.length)];
    sendMessage(makeSystemMsg(msg, { isBigMessage: true }));
  }, [sendMessage, makeSystemMsg]);

  // 28. Typing Indicator Flood
  const typingFlood = useCallback(() => {
    broadcast('typing_flood');
    sendMessage(makeSystemMsg('⌨️ Everyone is typing...'));
  }, [sendMessage, makeSystemMsg]);

  // 29. Server Stats
  const serverStats = useCallback(() => {
    const raw = localStorage.getItem('globalchat_messages');
    let msgCount = 0;
    const userSet = new Set<string>();
    if (raw) {
      try {
        const msgs = JSON.parse(raw);
        if (Array.isArray(msgs)) {
          msgCount = msgs.length;
          msgs.forEach((m: { username?: string }) => {
            if (m.username && m.username !== 'G.AI 🤖') userSet.add(m.username);
          });
        }
      } catch {
        /* ignore */
      }
    }
    sendMessage(
      makeSystemMsg(
        `📊 SERVER STATS\n💬 Messages: ${msgCount}\n👥 Unique Users: ${userSet.size}`,
        { isBigMessage: true }
      )
    );
  }, [sendMessage, makeSystemMsg]);

  // 30. Clear Admin Log
  const clearAdminLog = useCallback(() => {
    localStorage.removeItem('globalchat_modlog');
    broadcast('modlog_cleared');
    sendMessage(makeSystemMsg('🗑️ Admin log has been cleared!'));
  }, [sendMessage, makeSystemMsg]);

  // Suppress unused warning — currentUsername reserved for future per-user commands
  void currentUsername;

  return {
    rainbowMode,
    confettiBlast,
    flipChat,
    shakeMessages,
    bigHeadMode,
    ghostMode,
    giveVIP,
    removeVIP,
    partyMode,
    freezeUser,
    unfreezeUser,
    balloonMessage,
    summonBot,
    weatherAnnounce,
    changeAvatarColor,
    resetAvatarColor,
    neonTheme,
    retroTheme,
    resetTheme,
    spotlightUser,
    randomNickname,
    removeNickname,
    serverBirthday,
    triviaQuestion,
    countMessages,
    wordOfTheDay,
    mysteryBox,
    typingFlood,
    serverStats,
    clearAdminLog,
    getWithExpiry,
  };
}
