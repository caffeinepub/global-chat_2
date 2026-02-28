export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isBot?: boolean;
  isBigMessage?: boolean;
  isForced?: boolean;
  isSystem?: boolean;
  isBroadcast?: boolean;
}
