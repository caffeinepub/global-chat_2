# Specification

## Summary
**Goal:** Fix cross-device messaging by replacing the BroadcastChannel-only approach with a backend-persisted message store, so messages sent on one device appear on all other devices.

**Planned changes:**
- Add a stable chat message store in `backend/main.mo` with `getMessages(since: Nat)` and `postMessage(msg: ChatMessage)` functions, capped at 500 messages
- Add all ChatMessage fields (isBigMessage, isForced, isBot, isSystem, isBroadcast, id) to the Motoko record type
- Add a required `id: string` field to the `ChatMessage` TypeScript interface in `frontend/src/types/chat.ts`
- Ensure every message creation point (user, bot, admin, system, broadcast) generates a unique id
- Update `frontend/src/hooks/useBroadcastMessages.ts` to poll the backend every 2 seconds via `getMessages(since)` and merge new messages into local state
- Update message sending to call `postMessage` on the backend actor to persist messages
- Deduplicate messages by `id` to prevent duplicates from both polling and BroadcastChannel delivery
- Preserve existing BroadcastChannel and localStorage behavior as a secondary same-browser sync layer

**User-visible outcome:** Messages sent from a mobile device appear on a PC (and vice versa) within approximately 2 seconds, enabling true cross-device chat.
