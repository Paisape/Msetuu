# Mandir Setu — Mobile Screen → API Mapping

Source design: `Temple App.fig`. This file contains **4 pages** worth targeting for mobile: **User App Designs** (devotee-facing, 71 unique screens after de-duplicating design iterations), **Bramhin App Designs** (priest-facing, 13 screens), **Astrologers App** (astrologer-facing, 21 screens), and a **Website** page (already live as the Next.js web frontend, not mobile scope). Backend is the existing Next.js app at `Web/` (`src/app/api/**`).

Every screen below is mapped to the backend endpoint(s) that power it. Where no endpoint exists yet, it's marked **GAP** with a recommendation — these are the honest blockers, not guesses.

**Update:** at the user's request, the Splash and Home screens for the User app were rebuilt to match two provided reference screenshots (dark space background, circular ring menu of 8 modules around the Mandir Setu mark, top bar with mute/profile/notification icons) instead of the original Figma "Home" frames. The 8 ring items map to: Darshan → `DarshanList`, Puja Store → `SearchPujaExpertise`, Kundli → `Horoscope`, Geo Tag → `CameraGeotag`, E-Puja → `PujaList`, Jyotishi → `AstrologerList`, Yatra → new `YatraScreen` (see below), Chadhava → `ChadhavaList`. Building out the Bramhin and Astrologer apps further is paused for now — the customer (User) app is the priority.

**New since first pass:**
- **Yatra was wired up** (`src/screens/YatraScreen.tsx`, `src/api/yatra.ts`) — this was documented but not actually implemented in the first pass. Uses `GET/POST /api/yatra`; note the request body field is `destination` but the response/model field is `yatraDestination`.
- **Notifications is a new GAP.** The home screen's notification bell has nowhere to route to yet — there's no notifications model or endpoint anywhere under `Web/src/app/api` (confirmed by search). `src/screens/NotificationsScreen.tsx` explains this inline. Needs a new model + `GET /api/notifications`, ideally with Expo push delivery.

## Read this first — cross-cutting issues

1. **Mobile auth bridge (done).** The web app authenticates via a NextAuth HttpOnly session cookie, which React Native can't reliably store. Added `POST /api/mobile/login` — same credential check as `/api/login`, returns a NextAuth-compatible JWT to send as `Authorization: Bearer <token>`. Updated `src/libs/api-auth.ts` to decode that header as a fallback, so every existing protected route now works from mobile with zero other backend changes. `POST /api/auth/register` and `POST /api/auth/verify-email` are already public/unauthenticated and need no changes.
2. **Figma's "OTP Verification" screen implies phone/SMS OTP login.** The backend has no phone-based auth — only email+password (`/api/mobile/login`) and an email-verification OTP after registration (`POST /api/auth/verify-email`, body `{email, otp}`). Recommendation: point this screen at the registration-verification flow, or scope SMS OTP login as a separate backend project (needs an SMS provider + a phone field as a login credential).
3. **Darshan ticket booking has no backend model.** `DarshanTemple` (`GET/POST /api/darshan`) is a temple *directory* (name, location, QR code, 3D model for AR) — there is no `DarshanOrder` model, so screens like Darshan Form / Review Darshan Booking / Darshan Booking Success / Darshan Details all have nothing to call. Two ways to close this: (a) add a `DarshanOrder` model + `/api/darshan-bookings` routes mirroring the `epuja` order pattern (participants, payment, status), or (b) model "Special Entry Darshan" as a `PujaListing`/`PujaPackage` per temple and run it through the existing e-Puja order pipeline. Recommend (b) short-term since it reuses tested payment/order code; flagged per-screen below.
4. **The Bramhin (priest) app has ~no backend.** There's no `Priest` model, no `role: 'PRIEST'` (the `User.role` enum is `USER | ADMIN | ASTROLOGER`), and `PujaOrder` has no `assignedPriestId`. Every priest-app screen is listed with the new model/endpoints it needs.
5. **The Astrologer app's astrologer-facing half has no backend**, even though the *customer*-facing half (browse astrologers, book a consultation) is solid. `Astrologer` create/update is admin-only today; there's no self-service astrologer registration, availability toggle, dashboard, sessions list scoped to "my bookings", or earnings/transactions model.
6. **Live chat and calls are entirely unimplemented.** `ConsultationBooking` only stores booking metadata (who, when, price) — there's no messaging or call-signaling layer. This needs a real-time provider (e.g. a WebSocket relay, or a third-party SDK like Stream/Agora/Twilio) before the Chat/Call screens in either the User or Astrologer app can do anything beyond UI.
7. **`POST /api/upload` is admin-only**, but the "Camera → Tagged Successfully" geotag flow needs a regular user to upload a photo. Use `POST /api/upload/review-media` instead (open to any logged-in user, images ≤15MB) as the image host for `POST /api/geotag`.
8. **`Mantra` has no lyrics field.** The "Puja Details" aarti-lyrics screen displays full chalisa text (e.g. the Hanuman Chalisa), but the model is `{id, title, subtitle, fileUrl, duration, deity}` — no text field. Recommend adding `lyrics: String?`. (Matches the `.mp3` files already sitting in `Mantra/` at the project root — those look like they're meant to become `Mantra.fileUrl` content.)
9. **No self-service profile update.** "Edit Profile" has no `PATCH /api/profile`-equivalent — only admin-gated `customers/[id]`. Recommend adding a `GET/PATCH /api/profile` pair scoped to `requireUser()`.
10. Frames that are design assets, not real screens, are excluded from the tables below: logo lockups (`Mandir Setu - Final Logo 1`, `Light`, `Dark`), loaders/spinners (`Loader*`, `Circles/Spinner-Two-Circles`), `Bottom Nav img`, `Temple Shape`, `Animation`, `Star icons`, `Packages`, `Section 1`, numbered placeholder `Image 1`–`6`, `user-trust 1`, and `Food delivery app home page` (an unrelated inspiration/reference frame).

---

## App 1 — User / Devotee App

Existing scaffold: `Mobile/` (Expo, `mandirsetu-mobile`).

| Screen(s) | Purpose | API |
|---|---|---|
| Splash – Option 1/2/3/4, Splash - temp | App boot screen | None (static) |
| Sign In | Email + password login | `POST /api/mobile/login` |
| OTP Verification | Email verification after signup | `POST /api/auth/verify-email {email, otp}` — see cross-cutting #2 for the phone-OTP mismatch |
| Personal Details *(temple-browse content, mislabeled frame)* | Browse temples | `GET /api/darshan` |
| Edit Profile | Update name/gotra/DOB/occupation | **GAP** — no self-service profile endpoint (#9). Until added, screen can only display `GET /api/mobile/login` response fields read-only. |
| Home | Landing dashboard: banners, quick actions, featured pujas/chadhava, aartis | `GET /api/banners?page=home`, `GET /api/categories?module=epuja`, `GET /api/epuja/listings`, `GET /api/chadhava/listings`, `GET /api/mantra`, `GET /api/darshan` |
| Pilgrim Servicesm | Static menu grid (Darshan / Chadhava / Mandir Pujan / Gold-Silver / e-Pujan) | None — pure navigation |
| God/Goddesses | Browse/search deities | **GAP** — no deity model; closest existing concept is `GET /api/categories?module=epuja` if categories are deity-based, otherwise needs a new `Deity` model |
| City Search (all variants) | Pick a city to filter temples/services | **GAP** — no city/places endpoint; either ship a static city list client-side or add a geo endpoint |
| Chadhavas, Chadhava List | Browse temples/items to offer chadhava on | `GET /api/chadhava/listings` |
| Offer Gold/Silver | Pick chadhava type (gold/silver denomination) | Part of `ChadhavaListing` selection, same list endpoint |
| Summary (chadhava review) | Review before paying | Client-side summary of the `POST /api/chadhava` payload |
| *(Chadhava participant form — reached via "Offer Chadhava" CTA)* | Collect devotee details | `POST /api/chadhava {name, gender, dob, birthPlace, comment?, chadhavaListingId, persons:[{name,gotra}]}` → `{order, razorpayOrder}` |
| Temple Details - Pujas, Pujas | Browse e-puja offerings (per temple / all) | `GET /api/epuja/listings?category=` |
| Puja Filters | Filter puja list | `GET /api/epuja/listings` + client-side filtering (no server-side filter params beyond `category`) |
| Puja Details | Single puja detail + packages | `GET /api/epuja/listings/[id]` |
| Puja Form | Devotee/participant details | Feeds `POST /api/epuja` |
| Review Puja Booking | Bill summary before payment | Client-side summary; totals come from the listing/package `price`/`offerPrice`/`gstPercentage` already fetched |
| Puja Booking Success / failed | Booking confirmation / retry | Result of `POST /api/epuja` → `{order, razorpayOrder}`, then `POST /api/payment/verify {orderType:'EPUJA', orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature}` |
| Darshan (browse) | Browse darshan temples / special-entry options | `GET /api/darshan`; special-entry ticket types depend on cross-cutting #3 |
| Darshan Form, Review Darshan Booking, Darshan Booking Success/failed, Darshan Details - Upcoming/Completed | Book & manage a darshan ticket | **GAP**, see cross-cutting #3. Short-term: treat as an `EPUJA` order against a "Special Entry Darshan" `PujaListing`. |
| My Bookings | All bookings across modules | `GET /api/my-orders` (returns `{type, id, label, amount, status, paymentStatus, createdAt, ...}[]`); per-type detail from `GET /api/epuja`, `GET /api/chadhava`, `GET /api/kundli`, `GET /api/jyotish`, `GET /api/ecommerce`, `GET /api/yatra` |
| Puja Details - Upcoming | My-booking detail view | `GET /api/epuja` (filter client-side by id) — no confirmed `GET /api/epuja/[id]` for orders; flag for backend if needed |
| Horoscope | Kundli type/tier picker (Basic/Starter/Essential/Advanced/Premium) | `GET /api/kundli/listings` |
| Kundali, Kundali Details | Request a kundli / view status | `POST /api/kundli {name, gender, dob, timeOfBirth?, birthPlace, comment?, kundliListingId}`; status via `GET /api/kundli` or `GET /api/kundli/[id]` |
| Aartis | Audio player: mantras/chalisas/aartis | `GET /api/mantra` → `{id,title,subtitle,fileUrl,duration,deity}[]` |
| Puja Details *(aarti lyrics screen)* | Full chalisa/aarti text | `GET /api/mantra` + cross-cutting #8 (lyrics field gap) |
| FAQs | Browse FAQs / submit a query | `GET /api/faqs?page=` for browsing; the "write us your query" form is `POST /api/contact {name, email, message}` |
| Join Waitlist, Success | Pre-launch interest form | **GAP** — no waitlist model; recommend `POST /api/contact` as a stand-in, or a dedicated `Waitlist` model if this needs tracking separately from support contact |
| Search puja expertise *(User app variant — product categories)* | Ecommerce category browse | `GET /api/categories?module=ecommerce`, `GET /api/ecommerce/products?category=&purpose=&planet=&bestseller=` |
| My Profile *(astrologer public profile, reached from Home)* | View an astrologer before booking | `GET /api/jyotish/astrologers/[id]`, `GET /api/reviews?orderType=JYOTISH&targetId=<astrologerId>` |
| Start Chat, Start Call | Pick session duration/package | `GET /api/jyotish/astrologers` (pricing: `price30`/`offerPrice30`, `price60`/`offerPrice60` — note Figma shows more granular tiers like 10/15/20 min which the schema doesn't support yet, flag if needed) → `POST /api/jyotish {category, slotTime, name, email, phone, dob, timeOfBirth, placeOfBirth, duration:30|60, comment, astrologerId}` |
| Chat, Call | Live consultation session | **GAP** — see cross-cutting #6, no real-time layer exists |
| Astrology Specialization, Language Search | Filter astrologers by specialty/language | Client-side filter over `GET /api/jyotish/astrologers`; `specialties` exists on `Astrologer` (comma string), but there's **no `languages` field** — gap if language filtering needs to be server-driven |
| Payment Gateway | Card/UPI/Netbanking picker | Razorpay Checkout SDK using the `razorpayOrder` returned by whichever booking POST call preceded it; finalized via `POST /api/payment/verify` |
| Camera, Tagged Successfully | Geotag a temple visit photo | `POST /api/upload/review-media` (NOT `/api/upload` — admin-only, see #7) → `POST /api/geotag {imageUrl, latitude?, longitude?}` |
| Banner | Home carousel ("Today's Temple Visits: 10,000") | `GET /api/banners?page=home` |

---

## App 2 — Bramhin (Priest) App

No existing scaffold. Per cross-cutting #4, **this entire app needs new backend work** — the table below states what each screen needs built, not what exists.

| Screen(s) | Purpose | API |
|---|---|---|
| Sign In, OTP Verification, Registration Profile *(shared with other apps)* | Auth + role selection | `POST /api/mobile/login`; registration needs a `PRIEST` value added to the `User.role` enum (currently `USER \| ADMIN \| ASTROLOGER`) |
| Personal Details | KYC step 1: temple + puja-expertise selection, PIN code | **GAP** — needs a `Priest` model (or `PriestProfile` linked to `User`) with fields like `templeId`, `expertise[]`, `pincode` |
| Search Temple | Pick affiliated temple | Could reuse `GET /api/darshan`, once a `Priest.templeId` field exists to store the selection |
| Search puja expertise | Pick specialties | Needs `Priest.expertise` (comma-string or relation, mirroring `Astrologer.specialties`) |
| City Search | Pick city | Same gap as User app — no city/places endpoint |
| Aadhaar, PAN, Review Summary, Under review *("Puja Booking Success" frame, mislabeled)* | KYC document upload + review | **GAP** — needs `Priest.kycAadhaar`, `Priest.kycPan`, `Priest.verificationStatus` fields + an upload path (reuse `POST /api/upload/review-media` for document images) + an admin approval endpoint |
| Home | Dashboard: My Pujas / Earnings / Schedule tabs | **GAP** — needs `GET /api/priest/bookings` (assigned to me), `GET /api/priest/earnings` |
| New Puja Booking, New Puja Bookings | Accept/reject an assigned booking, see commission | **GAP** — needs `PujaOrder.assignedPriestId` field + `PATCH /api/priest/bookings/[id] {action:'accept'\|'reject'}` |
| Puja Details *(priest's view)* | Participant list + "Complete Puja" action | **GAP** — needs `GET /api/priest/bookings/[id]` + a status-completion endpoint (no order-level PATCH exists for `epuja` orders today at all, admin or otherwise) |
| Scan QR | Redeem/check in a customer's booking QR | **GAP** — no QR redemption endpoint exists; `DarshanTemple.qrCodeUrl` is a display QR for the temple, not a per-booking scan-to-verify code |

---

## App 3 — Astrologer App

No existing scaffold. Customer-facing astrologer data is solid; everything astrologer-facing needs new endpoints (cross-cutting #5).

| Screen(s) | Purpose | API |
|---|---|---|
| Sign In, OTP Verification, Registration Profile | Auth + role selection | `POST /api/mobile/login`; role selection needs registration to also create the linked `Astrologer` row (today `POST /api/auth/register` only creates a `User`, disconnected from `Astrologer`) |
| Personal Details *(set preferences: chat/call/both, per-min pricing, daily availability)* | Astrologer self-service profile setup | **GAP** — `PATCH /api/jyotish/astrologers/[id]` exists but is **admin-only**; needs an astrologer-self-service variant, and `Astrologer` has no `availableFrom`/`availableTo`/`chatEnabled`/`callEnabled` fields |
| Language Search, Astrology Specialization | Pick specialties during onboarding | Writes to `Astrologer.specialties`; no `languages` field exists (gap, same as User app note) |
| Aadhaar, PAN, Review Summary, Under review | KYC | **GAP** — `Astrologer` has no KYC fields (`aadhaar`, `pan`, `certifications`, `yearsOfExperience`, `verificationStatus`) at all today, only `{name,bio,image,rating,specialties,price30,offerPrice30,price60,offerPrice60,gst*}` |
| Splash - temp | App boot screen | None |
| Home | Dashboard: online/offline toggle, earnings, session counts | **GAP** — needs `PATCH /api/astrologer/availability` (no `isOnline` field on `Astrologer`), `GET /api/astrologer/dashboard` |
| Chat Invite | Incoming request: accept/decline/mark busy | **GAP** — real-time, see cross-cutting #6 |
| Chat, Call | Live session | **GAP** — see cross-cutting #6 |
| Sessions | My consultation history + detail | Close to `GET /api/jyotish`, but that endpoint scopes to "own bookings as the customer" or `?all=1` for admin — **GAP**: needs astrologer-scoped filtering (e.g. `?astrologerId=self`) |
| Transactions | Earnings/payout history | **GAP** — no transaction/payout model exists |
| My Profile | View/edit own public profile | Same gap as "Personal Details" above — read is public (`GET /api/jyotish/astrologers/[id]`), write is admin-only |
| FAQs | Browse FAQs / submit a query | `GET /api/faqs?page=`, `POST /api/contact` for the query form (same pattern as User app) |
| Darshan *(mislabeled frame — actually contains Privacy Policy legal text)* | Static legal content | Not really a Darshan screen; either static in-app copy or `GET /api/faqs?page=privacy` if legal content is meant to be CMS-managed |
| Customer Profile *(User-app account menu, reused here by mistake)* | Account settings menu | Same as User app's Edit Profile / account section |

---

## Summary of backend work needed (priority order)

1. **Done:** mobile bearer-token auth bridge (`POST /api/mobile/login` + `api-auth.ts` update).
2. Self-service profile: `GET/PATCH /api/profile`.
3. Darshan ticket booking (`DarshanOrder` model or reuse `epuja` pipeline with a "Special Entry Darshan" listing type).
4. Priest role + `Priest`/KYC model + assignment on `PujaOrder` + priest dashboard/accept-reject/complete endpoints.
5. Astrologer self-service (registration, KYC, availability, own-sessions, earnings) — currently entirely admin-gated or missing.
6. Real-time chat/call layer for both User↔Astrologer and any future User↔Priest live interaction.
7. Small fixes: `Mantra.lyrics` field, switch geotag photo upload to `/api/upload/review-media`, add `Astrologer.languages`, decide on city/deity data source.
