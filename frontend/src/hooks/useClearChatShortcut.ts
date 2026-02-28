import { useState, useEffect, useRef, RefObject, useCallback } from 'react';

export function useClearChatShortcut(
  chatAreaRef: RefObject<HTMLDivElement | null>,
  clearMessages: () => void
) {
  const [showClearToast, setShowClearToast] = useState(false);
  const awaitingConfirm = useRef(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissClear = useCallback(() => {
    setShowClearToast(false);
    awaitingConfirm.current = false;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  const confirmClear = useCallback(() => {
    clearMessages();
    dismissClear();
  }, [clearMessages, dismissClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle confirmation: press C while toast is showing
      if (awaitingConfirm.current && e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        confirmClear();
        return;
      }

      // Ctrl+C with no text selected
      if (e.ctrlKey && e.key === 'c' && !e.metaKey) {
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;

        if (hasSelection) return; // Allow normal copy

        // Only trigger if focused in chat area or document body
        const active = document.activeElement;
        const isInInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (isInInput) return; // Don't intercept when typing

        e.preventDefault();
        setShowClearToast(true);
        awaitingConfirm.current = true;

        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(() => {
          setShowClearToast(false);
          awaitingConfirm.current = false;
        }, 5000);
      }

      // Escape dismisses toast
      if (e.key === 'Escape' && awaitingConfirm.current) {
        dismissClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [confirmClear, dismissClear]);

  return { showClearToast, confirmClear, dismissClear };
}
