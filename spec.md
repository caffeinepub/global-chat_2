# Specification

## Summary
**Goal:** Remove the floating G.AI Chat button and all broken admin commands from the Global Chat app, then replace them with 30 new fun and fully-working admin commands with real-time visual effects broadcast across all tabs.

**Planned changes:**
- Remove the floating `G.AI Chat` button (`AIChatButton.tsx`) and `AIChatPanel.tsx` from `ChatPage.tsx`, including all related imports and state — while keeping `@G.ai` mention detection intact
- Remove all broken admin commands (mute, unmute, mass mute/unmute, ban, unban, server shutdown, startup, slow mode, lock/unlock chat) and their associated hooks and localStorage logic
- Remove `ShutdownOverlay.tsx`, `StartupOverlay.tsx`, `OwnerShutdownBanner.tsx` and all references to them in `ChatPage.tsx`, `TopBar.tsx`, `Sidebar.tsx`, and `MessageInputBar.tsx`
- Remove slow mode, mute, chat lock, and manual ban enforcement from `MessageInputBar.tsx`; keep only AI moderation ban (`globalchat_bans`) and the new freeze command (`globalchat_frozen`) enforcement
- Add 30 new fun admin commands to `AdminPanel.tsx` (accessible only to AI.Caffeine):
  1. **Rainbow Mode** — rainbow text animation on all messages for 60s (`globalchat_rainbow_mode`)
  2. **Confetti Blast** — one-time confetti particle animation for 3s on all tabs
  3. **Flip Chat** — flips chat area upside-down for 30s (`globalchat_flip_mode`)
  4. **Shake Messages** — shake animation on all messages for 10s
  5. **Big Head Mode** — avatars render 3x larger for 60s (`globalchat_bighead`)
  6. **Ghost Mode** — target user's messages at 30% opacity with 👻 icon for 5min (`globalchat_ghost_users`)
  7. **VIP Crown** — award 👑 badge next to target username (`globalchat_vip_users`)
  8. **Remove VIP** — remove VIP crown from target username
  9. **Party Mode** — cycling background color animation on sidebar/topbar for 60s
  10. **Freeze User** — block target username from sending messages for configurable duration (`globalchat_frozen`)
  11. **Unfreeze User** — remove freeze from target username
  12. **Balloon Message** — post festive message with 🎈🎈🎈 and pink background in global chat
  13. **Summon Bot** — force G.AI 🤖 to post a random fun fact or joke
  14. **Weather Announce** — post a system weather status message from a preset dropdown
  15. **Change Avatar Color** — override avatar circle color for target username (`globalchat_avatar_colors`)
  16. **Reset Avatar Color** — remove avatar color override for target username
  17. **Neon Theme** — apply neon/cyberpunk CSS theme (`globalchat_theme = 'neon'`)
  18. **Retro Theme** — apply retro/80s CSS theme (`globalchat_theme = 'retro'`)
  19. **Reset Theme** — restore default Discord dark theme
  20. **Spotlight User** — post golden banner system message celebrating a specific user
  21. **Random Nickname** — assign bracketed funny nickname to target username for 10min (`globalchat_nicknames`)
  22. **Remove Nickname** — remove temporary nickname from target username
  23. **Server Birthday** — broadcast full-screen 🎂 birthday animation overlay for 5s to non-owner users
  24. **Trivia Question** — post a multiple-choice trivia question as a bot message
  25. **Count Messages** — display total message count from `globalchat_messages` inline in admin panel
  26. **Word of the Day** — post a dictionary-style bot message with admin-entered word + definition
  27. **Mystery Box** — post a bot message revealing a random emoji from a curated list of 50
  28. **Typing Indicator Flood** — show fake typing indicator with 3 random usernames for 5s
  29. **Server Stats** — post bot message with total messages, known users, and current timestamp
  30. **Clear Admin Log** — wipe `globalchat_mod_log` and show inline confirmation
- Update `ChatArea.tsx` and `ChatPage.tsx` to read and apply all new fun admin states from localStorage/BroadcastChannel: rainbow text, flipped chat, big avatars, ghost messages, VIP crowns, nicknames, custom avatar colors, typing indicator flood, confetti/birthday overlays, and theme changes

**User-visible outcome:** The chat UI no longer shows a floating G.AI Chat button. The Admin Panel (for AI.Caffeine) now contains 30 working fun commands that produce real-time visual effects and interactive messages across all open tabs, replacing all previously broken commands.
