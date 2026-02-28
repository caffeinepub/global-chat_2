import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Bot, Send, Loader2, Key, Eye, EyeOff } from 'lucide-react';
import { chatCompletion, getOpenAIKey, saveOpenAIKey, OpenAIMessage } from '../lib/openai';

interface AIChatPanelProps {
  username: string;
  onClose: () => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export default function AIChatPanel({ username, onClose }: AIChatPanelProps) {
  const [apiKey, setApiKey] = useState<string | null>(() => getOpenAIKey());
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState('');

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hi ${username}! 👋 I'm G.AI, your personal assistant powered by ChatGPT. Ask me anything!`,
      timestamp: Date.now(),
    },
  ]);
  // Full conversation history for memory (excludes the welcome message)
  const [history, setHistory] = useState<OpenAIMessage[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (apiKey) {
      inputRef.current?.focus();
    }
  }, [apiKey]);

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (!trimmed.startsWith('sk-')) {
      setKeyError('API key must start with "sk-". Please check your key.');
      return;
    }
    saveOpenAIKey(trimmed);
    setApiKey(trimmed);
    setKeyError('');
    setKeyInput('');
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !apiKey) return;

    const userMsg: AIMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build updated history with the new user message
    const updatedHistory: OpenAIMessage[] = [
      ...history,
      { role: 'user', content: text },
    ];

    try {
      const systemMessage: OpenAIMessage = {
        role: 'system',
        content: `You are G.AI, a helpful and friendly personal assistant. You are chatting privately with ${username}. Be conversational, helpful, and remember the context of this conversation.`,
      };

      const aiText = await chatCompletion(
        [systemMessage, ...updatedHistory],
        apiKey
      );

      const response = aiText || 'Sorry, I could not generate a response.';

      // Update history with both user message and assistant response
      setHistory([
        ...updatedHistory,
        { role: 'assistant', content: response },
      ]);

      const aiMsg: AIMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorText =
        err instanceof Error
          ? `Error: ${err.message}`
          : 'Sorry, I encountered an error. Please try again.';
      const errMsg: AIMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: errorText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col w-full sm:w-96 h-[520px] sm:h-[580px] sm:bottom-6 sm:right-6 bg-dc-sidebar rounded-t-2xl sm:rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-dc-bg/50 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-full bg-dc-accent flex items-center justify-center shadow-md shadow-dc-accent/30">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">G.AI Assistant</p>
          <p className="text-xs text-green-400">● Powered by ChatGPT</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-dc-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* API Key Setup Screen */}
      {!apiKey ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <div className="w-14 h-14 rounded-full bg-dc-accent/20 flex items-center justify-center">
            <Key className="w-7 h-7 text-dc-accent" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm mb-1">OpenAI API Key Required</p>
            <p className="text-dc-muted text-xs leading-relaxed">
              Enter your OpenAI API key to enable G.AI. Your key is stored locally in your browser and never sent to our servers.
            </p>
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 bg-dc-input rounded-xl px-3 py-2 border border-white/5 focus-within:border-dc-accent/40 transition-colors">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => { setKeyInput(e.target.value); setKeyError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                placeholder="sk-..."
                className="flex-1 bg-transparent text-white placeholder:text-dc-muted text-sm focus:outline-none"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="text-dc-muted hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {keyError && (
              <p className="text-red-400 text-xs px-1">{keyError}</p>
            )}
            <button
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
              className="w-full py-2 rounded-xl bg-dc-accent hover:bg-dc-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
            >
              Save & Activate G.AI
            </button>
          </div>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dc-accent text-xs hover:underline"
          >
            Get an API key from OpenAI →
          </a>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e1f22 transparent' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-dc-accent flex items-center justify-center text-sm shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-dc-accent text-white rounded-tr-sm'
                      : 'bg-dc-chat text-dc-text rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-dc-accent flex items-center justify-center text-sm shrink-0">
                  🤖
                </div>
                <div className="bg-dc-chat px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-dc-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-dc-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-dc-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-2 bg-dc-input rounded-xl px-3 py-2 border border-white/5 focus-within:border-dc-accent/30 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask G.AI anything..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-white placeholder:text-dc-muted text-sm focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-lg bg-dc-accent hover:bg-dc-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all hover:scale-105 active:scale-95"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[10px] text-dc-muted">
                Private conversation · Memory enabled
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('globalchat_openai_key');
                  setApiKey(null);
                  setHistory([]);
                }}
                className="text-[10px] text-dc-muted hover:text-red-400 transition-colors"
              >
                Change key
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
