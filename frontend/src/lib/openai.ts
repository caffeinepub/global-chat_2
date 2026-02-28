const OPENAI_API_KEY_STORAGE = 'globalchat_openai_key';

export function getOpenAIKey(): string | null {
  return localStorage.getItem(OPENAI_API_KEY_STORAGE);
}

export function saveOpenAIKey(key: string): void {
  localStorage.setItem(OPENAI_API_KEY_STORAGE, key.trim());
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function chatCompletion(
  messages: OpenAIMessage[],
  apiKey?: string
): Promise<string> {
  const key = apiKey ?? getOpenAIKey();
  if (!key) throw new Error('No OpenAI API key configured.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `OpenAI API error: ${response.status}`
    );
  }

  const data: OpenAIChatResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

/**
 * Checks whether a message is disrespectful (profanity, slurs, harassment, hate speech).
 * Returns true if the message should be flagged.
 */
export async function moderateMessage(text: string): Promise<boolean> {
  const key = getOpenAIKey();
  if (!key) return false;

  try {
    const result = await chatCompletion(
      [
        {
          role: 'system',
          content:
            'You are a content moderation assistant. Respond with only "YES" if the following message contains disrespectful content such as profanity, slurs, harassment, hate speech, or personal attacks. Respond with only "NO" if it is acceptable. Do not explain.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      key
    );
    return result.trim().toUpperCase().startsWith('YES');
  } catch {
    return false;
  }
}
