import { useState, useEffect } from 'react';

export function useEmojiPickerShortcut() {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && !e.shiftKey) {
        e.preventDefault();
        setShowEmojiPicker(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { showEmojiPicker, setShowEmojiPicker };
}
