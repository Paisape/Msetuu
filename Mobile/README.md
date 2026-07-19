# Mandir Setu — Mobile (Expo / React Native)

Minimal starting skeleton for the Android/iOS apps: login, registration, and a home screen
listing the six service modules. This has **not** been run or tested (no emulator available
in the environment it was built in) — treat it as a scaffold, not a finished app.

## Known gap: authentication

The Next.js backend uses **NextAuth with cookie-based sessions**, which browsers handle
automatically but native apps cannot. `src/api/client.ts` currently assumes a Bearer-token
scheme that the backend doesn't issue yet. Before this app can actually authenticate against
the backend, add a mobile-friendly auth flow, for example:

1. A `POST /api/auth/mobile-login` route that verifies credentials (reuse the logic in
   `/api/login`) and returns a signed JWT (e.g. via `jsonwebtoken`, signed with
   `NEXTAUTH_SECRET`).
2. Update `requireUser()` / `requireAdmin()` in `src/libs/api-auth.ts` (web project) to also
   accept `Authorization: Bearer <jwt>` and verify it, falling back to the existing
   cookie-session check for the web app.
3. Store the returned JWT in `AsyncStorage` on the mobile side (already wired up in
   `src/api/client.ts`) and send it as a Bearer token on every request.

## Running locally (once you have Node + Expo CLI + Android Studio/Xcode set up)

```bash
cd mobile-app
npm install
npm start
```

Update `API_BASE_URL` in `src/api/client.ts` to your machine's LAN IP (not `localhost`) when
testing on a physical device or emulator.

## What's built

- `App.tsx` — simple screen router (no navigation library wired in yet; swap in
  `@react-navigation/native-stack`, already listed in `package.json`, once there are more
  than a few screens).
- `src/screens/LoginScreen.tsx`, `RegisterScreen.tsx`, `HomeScreen.tsx`.
- `src/api/client.ts` — fetch wrapper pointing at the Next.js API routes.

## What's not built

- Screens for each module (Chadhava, E-Puja, Kundli, Jyotish, E-commerce, Yatra, Darshan,
  Geo-tagging) — `HomeScreen` links to placeholder screens for now.
- Push notifications, camera/geolocation integration for the Geo-Tagging feature, Razorpay
  (or similar) mobile payment SDK integration.
- App icons/splash assets (`./assets/icon.png` referenced in `app.json` doesn't exist yet).
