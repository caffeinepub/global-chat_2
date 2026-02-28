// Export chat log as JSON file download

const STORAGE_KEY = 'globalchat_messages';

export function exportChatLog(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const messages = raw ? JSON.parse(raw) : [];
    const json = JSON.stringify(messages, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-log-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}
