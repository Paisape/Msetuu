# Mandir Setu — Mobile / User App (Expo / React Native)

The devotee-facing app, matching the "User App Designs" page of `Temple App.fig`. Built with
Expo + React Navigation, wired to the existing Next.js backend in `Web/`. This has **not**
been run on a device or simulator (no emulator available in the environment it was built in)
— run through it once locally before shipping.

See **`../docs/MOBILE_API_MAPPING.md`** for the full screen-by-screen list and which backend
endpoint powers each one, plus every known gap (features the Figma design wants that the
backend doesn't support yet — Darshan ticket booking, live chat/call, self-service profile
editing, and a few others).

## Authentication

The web app uses NextAuth's HttpOnly cookie session, which this app can't use. It authenticates
via `POST /api/mobile/login` instead (added to the backend alongside this app), which returns a
bearer token stored in `AsyncStorage` and sent as `Authorization: Bearer <token>` on every
request (`src/api/client.ts`). `POST /api/auth/register` and `POST /api/auth/verify-email` are
unauthenticated and used directly.

For production, swap `AsyncStorage` for `expo-secure-store` so the token isn't stored in
plaintext — noted inline in `client.ts`.

## Running locally

```bash
cd Mobile
npm install
npm start
```

Update `API_BASE_URL` in `src/api/client.ts` to your machine's LAN IP (not `localhost`) when
testing on a physical device or emulator.

## Building an APK

This has to run on your own computer — cloud builds need Expo's build servers, and local builds
need the Android SDK, neither of which this project's dev sandbox has network access to.

**Before building**, point `API_BASE_URL` in `src/api/client.ts` at your real deployed backend
URL (not `localhost` — a device/emulator can't reach your machine's localhost).

**Option A — EAS cloud build (no Android Studio needed):**

```bash
cd Mobile
npm install -g eas-cli
eas login                          # free Expo account
eas build -p android --profile preview
```

`eas.json` (already in this folder) has the `preview` profile configured to output an installable
`.apk` (EAS defaults to `.aab` otherwise, which isn't directly installable). The command prints a
download link when the build finishes.

**Option B — fully local build (needs Android Studio/SDK installed):**

```bash
cd Mobile
npx expo prebuild -p android
cd android && ./gradlew assembleDebug
```

APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

## What's built

- Full navigation (`src/navigation`) covering every real screen from the Figma "User App
  Designs" page (auth, home, darshan, e-puja/chadhava/kundli booking flows, astrologer
  chat/call booking, my bookings, aartis, FAQs, geotagging, shop).
- `src/api/*` — typed functions for every backend feature area used by the app.
- Screens that hit a real endpoint show live data. Screens for features with no backend support
  yet show an inline "Backend not built yet" notice explaining exactly what's missing, instead
  of silently failing — search the codebase for `GapNotice` to find them all.

## What's not built

- Razorpay Checkout SDK integration (`PaymentGatewayScreen.tsx` explains the 3 remaining
  steps — needs a dev build, doesn't work in Expo Go).
- Real camera capture for the geotagging flow (`expo-image-picker` isn't installed).
- Live chat/call UI (no real-time backend layer exists yet — see the mapping doc).
- App icons/splash image (`app.json` intentionally omits an `icon` path since no image asset
  exists yet — add one under `assets/` and reference it before shipping).
