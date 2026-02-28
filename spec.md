# Specification

## Summary
**Goal:** Fix the blank page issue that occurs when the Global Chat app is opened in a new tab or window.

**Planned changes:**
- Audit `frontend/src/App.tsx` to ensure the session check on mount correctly reads `globalchat_session` from localStorage and transitions to either `LandingPage` or `ChatPage` without rendering a blank screen
- Ensure the loading/spinner state always resolves on initial render and never leaves the app stuck in a blank state
- Audit `frontend/index.html` to verify the root `<div id="root">` is always present and correctly targeted
- Wrap localStorage reads/writes in `frontend/src/lib/auth.ts` with try-catch blocks to prevent initialization failures (e.g., malformed data, empty storage) from crashing the app

**User-visible outcome:** Opening the app in a new tab or window always renders either the Landing Page or Chat Page correctly, with no blank screen and no console errors on initial load.
