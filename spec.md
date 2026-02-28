# Specification

## Summary
**Goal:** Fix the broken login authentication flow in the Global Chat frontend so that registration, login, and session persistence all work correctly end-to-end.

**Planned changes:**
- Fix `frontend/src/lib/auth.ts` so the `login` function encodes passwords with `btoa` consistently with `register`, ensuring credential comparison works correctly
- Ensure `seedOwnerAccount` seeds the `AI.Caffeine` account with `btoa('2580')` without overwriting other users
- Wrap all localStorage reads and writes in `auth.ts` in try/catch blocks
- Fix `frontend/src/pages/LandingPage.tsx` so the login form calls `login` from `auth.ts`, shows `'Invalid username or password.'` inline on failure, writes a valid `globalchat_session` (`{ username, isAuthenticated: true }`) to localStorage on success, and navigates to ChatPage
- Fix the Create Account flow in `LandingPage.tsx` to call `register` then immediately log in and navigate to ChatPage
- Wrap all localStorage operations in `LandingPage.tsx` in try/catch
- Fix `frontend/src/App.tsx` to synchronously detect a valid authenticated session on mount and render ChatPage directly, and expose a stable `onLogin`/`setSession` callback to `LandingPage` so React state updates immediately on login without requiring a page reload

**User-visible outcome:** Users can register and log in with their credentials, the `AI.Caffeine` account works with password `2580`, invalid credentials show a clear error message, and the app transitions to ChatPage immediately after login without blank screens or page reloads.
