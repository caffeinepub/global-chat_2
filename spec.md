# Specification

## Summary
**Goal:** Fix the shutdown black overlay and startup green screen so they correctly appear for non-admin (non-`AI.Caffeine`) users in the Global Chat application.

**Planned changes:**
- Fix `ShutdownOverlay.tsx` to render a full-screen black overlay for non-owner users when the server is shut down, displaying a '🔴 Server Shut Down' title, the admin's shutdown message, and a live mm:ss countdown timer until `shutdownUntil`; block all message input while active
- Fix `StartupOverlay.tsx` to render a full-screen green overlay displaying '🟢 Server Starting Up...' for exactly 5 seconds when the server transitions from shutdown to running, then fade out and restore normal chat UI
- Audit and fix the `useServerState` hook and `ChatPage.tsx` to correctly read `globalchat_server_state` from localStorage on initial page load and apply the shutdown overlay immediately if the server is already shut down
- Ensure both overlays are driven by React state kept in sync via the `globalchat_server_control` BroadcastChannel so all open non-owner tabs react in real time without a page reload
- Ensure neither overlay is ever shown to the `AI.Caffeine` owner account

**User-visible outcome:** Non-admin users will immediately see a black countdown overlay when the server is shut down and a green startup screen when it comes back online, both working across all open tabs in real time without requiring a page reload.
