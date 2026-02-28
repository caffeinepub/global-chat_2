import { ChatMessage } from '../types/chat';

const SAMPLE_USERS = [
  { name: 'Alex_Dev', messages: ['Hey everyone! 👋 Just joined the chat!', 'This is so cool, a global chat room!'] },
  { name: 'Sarah_K', messages: ['Good morning from London! ☀️', 'Anyone else here from Europe?'] },
  { name: 'TechNerd42', messages: ['@G.ai what is the speed of light?', 'Just discovered this place, love it already'] },
  { name: 'Mia_Chen', messages: ['Hello world! 🌍', 'This reminds me of the old IRC days 😄'] },
  { name: 'JohnDoe99', messages: ['What\'s everyone up to today?', 'First time here, seems pretty active!'] },
  { name: 'Luna_Star', messages: ['✨ Greetings from Tokyo!', 'The internet really does connect everyone'] },
  { name: 'CodeMonkey', messages: ['Built with React + BroadcastChannel API? Nice tech stack!', 'Pro tip: try Ctrl+Alt for a surprise 😏'] },
];

export function generateSampleMessages(): ChatMessage[] {
  const now = Date.now();
  const messages: ChatMessage[] = [];
  let timeOffset = 25 * 60 * 1000; // Start 25 minutes ago

  const picks = [
    { user: SAMPLE_USERS[0], msgIdx: 0 },
    { user: SAMPLE_USERS[1], msgIdx: 0 },
    { user: SAMPLE_USERS[3], msgIdx: 0 },
    { user: SAMPLE_USERS[4], msgIdx: 0 },
    { user: SAMPLE_USERS[5], msgIdx: 0 },
    { user: SAMPLE_USERS[6], msgIdx: 0 },
    { user: SAMPLE_USERS[2], msgIdx: 0 },
    { user: SAMPLE_USERS[1], msgIdx: 1 },
  ];

  picks.forEach((pick, i) => {
    timeOffset -= Math.floor(Math.random() * 3 * 60 * 1000) + 60 * 1000;
    messages.push({
      id: `sample-${i}`,
      username: pick.user.name,
      text: pick.user.messages[pick.msgIdx],
      timestamp: now - timeOffset,
      isBot: false,
    });
  });

  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

export function seedSampleMessagesIfEmpty(): ChatMessage[] {
  const key = 'globalchat_messages';
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  const samples = generateSampleMessages();
  localStorage.setItem(key, JSON.stringify(samples));
  return samples;
}
