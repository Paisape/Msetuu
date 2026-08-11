# Complete API Integration Guide

This document outlines the expected flows, payloads, and integration steps for all modules in the Mandirsetuu frontend application.

## 1. Base URL & Image Loading
- **API Base URL**: `[YOUR_SERVER_URL]` (e.g., `https://api.mandirsetuu.com` or your Coolify domain).
- **Image URLs**: If the API returns a relative path starting with `/uploads/` (e.g., `/uploads/banners/hero.png`), prepend your API Base URL to it when rendering.

---

## 2. Auth Flow (Login & Registration)
- **Registration**: `POST /api/auth/register`
  - Payload: `{ "name": "...", "email": "...", "phone": "...", "password": "...", "referralCode": "..." }`
  - **Dynamic Validations (Country Code Dropdown)**:
    - **Indian Users (Country Code `+91`)**: `phone` is **compulsory** (minimum 10 digits). `email` is optional.
    - **International Users (Other prefixes e.g. +1, +44)**: `email` is **compulsory** (valid email format). `phone` is optional.
  - **Verification Routing**:
    - If `email` is provided, an Email OTP is sent via SMTP.
    - If an Indian phone (`+91`) is provided, an SMS OTP is sent via SMS gateway.
    - If an International phone is provided, SMS OTP dispatch is **skipped** (verify via email only).
- **Credentials Login**: `POST /api/login`
  - Payload: `{ "email": "email_or_phone_string", "password": "...", "otp": "...", "deviceId": "...", "deviceName": "...", "os": "..." }`
  - **Phone Normalization**: If the `email` field receives a 10-digit mobile number (e.g. `9529160004`), the backend automatically prepends `+91` to match the database record format, allowing logins with or without the prefix.
  - Response: Returns a complete authentication token payload identical to OTP verification:
    ```json
    {
      "success": true,
      "message": "Logged in successfully.",
      "isNewUser": false,
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 2592000,
      "refreshToken": "...",
      "refreshExpiresIn": 31536000,
      "id": "...",                 // Root fields returned for NextAuth backward compatibility
      "name": "...",
      "email": "...",
      "role": "USER",
      "image": "...",
      "user": {                    // Nested user object for your app developer
        "id": "...",
        "name": "...",
        "email": "...",
        "role": "USER",
        "image": "...",
        "referralCode": "...",
        "referralWalletBalance": 0
      }
    }
    ```
- **Send OTP**: `POST /api/auth/send-otp` 
  - Payload: `{ "contact": "email_or_phone", "type": "EMAIL" | "SMS", "purpose": "LOGIN" | "REGISTER" }`
  - **International SMS block**: If the `contact` parameter is a phone number that is not Indian (i.e. does not start with `+91` or `91`), the API returns a `400 Bad Request` block error immediately to prevent failed SMS dispatches.
- **Verify OTP**: `POST /api/auth/verify-otp`
  - Payload: `{ "contact": "email_or_phone", "otp": "123456", "purpose": "LOGIN" | "REGISTER", "deviceId": "...", "deviceName": "...", "os": "..." }`
  - Response: Both `LOGIN` and `REGISTER` verification return the same complete lightweight authentication token payload:
    ```json
    {
      "success": true,
      "message": "Verified successfully.",
      "isNewUser": false,
      "accessToken": "ey...",
      "expiresIn": 2592000,
      "refreshToken": "...",
      "refreshExpiresIn": 31536000,
      "user": {
        "id": "...",
        "name": "...",
        "email": "...",
        "role": "USER",
        "image": "...",
        "referralCode": "...",
        "referralWalletBalance": 0
      }
    }
    ```

---

## 3. Profile & Core APIs
- **Fetch Profile**: `GET /api/profile`
  - Response: Returns all user details, including devotee profile fields:
    ```json
    {
      "id": "...",
      "name": "...",
      "email": "...",
      "phone": "...",
      "image": "...",
      "role": "USER",
      "occupation": "...",
      "dob": "...",
      "tob": "...",
      "pob": "...",
      "gender": "...",
      "gotra": "..."
    }
    ```
- **Edit Profile**: `PUT /api/profile`
  - Payload: Accepts `name`, `email`, `phone`, `image` (avatar URL string), `occupation`, `dob`, `tob`, `pob`, `gender`, `gotra`.
- **My Orders**: `GET /api/my-orders` (Returns a mixed list of all past bookings)
- **Address Book**: `GET /api/addresses`, `POST /api/addresses`, `PATCH /api/addresses/[id]`, `DELETE /api/addresses/[id]`
- **Contact Us**: `POST /api/contact`

---

## 4. Jyotish (Astrology Consultation) Flow
Single-step booking form (admin assigns astrologer/calendar later).
1. **Fetch Categories**: `GET /api/jyotish/categories`
2. **Submit Booking**: `POST /api/jyotish`
   - Payload: `{ "category": "Kundli Reading", "durationMins": 60, "name": "...", "email": "...", "phone": "...", "dob": "YYYY-MM-DD", "timeOfBirth": "14:30", "placeOfBirth": "...", "comment": "..." }`
3. **Payment Verification**: (See Section 11)

---

## 5. E-Pooja Flow
1. **Listings & Packages**: `GET /api/epuja/listings`, `GET /api/epuja/listings/[id]`, `GET /api/epuja/listings/[id]/packages`
2. **Submit Booking**: `POST /api/epuja`
   - Payload: `{ "name": "...", "gender": "...", "dob": "...", "birthPlace": "...", "pujaListingId": "...", "pujaPackageId": "...", "devotees": [{ "name": "...", "gotra": "..." }] }`
3. **Payment Verification**: (See Section 11)

---

## 6. Chadhava Flow
1. **Listings**: `GET /api/chadhava/listings`, `GET /api/chadhava/listings/[id]`
2. **Submit Booking**: `POST /api/chadhava`
   - Payload: `{ "name": "...", "gender": "...", "dob": "...", "birthPlace": "...", "chadhavaListingId": "...", "persons": [{ "name": "...", "gotra": "..." }] }`
3. **Payment Verification**: (See Section 11)

---

## 7. Kundli Generation & Reading Flow
1. **Listings**: `GET /api/kundli/listings`
2. **Submit Booking**: `POST /api/kundli`
   - Payload: `{ "name": "...", "gender": "...", "dob": "...", "timeOfBirth": "...", "birthPlace": "...", "kundliListingId": "..." }`
3. **Payment Verification**: (See Section 11)

---

## 8. E-Commerce (Shop) Flow
1. **Browse Products**: `GET /api/ecommerce/products`
2. **Submit Order**: `POST /api/ecommerce`
   - Payload: `{ "productId": "...", "quantity": 1, "carat": 3.5, "address": "Shipping Address String" }` (Note: `carat` is only for Gemstones).
3. **Payment Verification**: (See Section 11)

---

## 9. Offers & Promos Flow
Special dynamic pricing offers shown on the home page.
1. **Get Offer Details**: `GET /api/offer/[slug]`
2. **Submit Order**: `POST /api/offer/[slug]/order`
   - Payload: `{ "name": "...", "phone": "...", "address": "...", "pincode": "..." }`
3. **Payment Verification**: (See Section 11)

---

## 10. Secondary Modules
- **Free Astrology (Daily Features)**: `GET /api/astrology/panchang`, `GET /api/astrology/horoscope`, `GET /api/astrology/match-making`
- **Geotagging**: `GET /api/geotag/temples` (List temples), `POST /api/geotag` (Check-in to earn points), `GET /api/geotag/points` (Wallet balance), `POST /api/geotag/redeem` (Redeem points).
- **Yatra**: `GET /api/yatra`, `GET /api/yatra/[id]`, `POST /api/yatra` (Payload: `yatraId`, `passengers` array, `totalAmount`).
- **Reviews**: `GET /api/reviews/[id]` (fetch reviews for any product/listing), `POST /api/reviews` (Payload: `targetId`, `targetType`, `rating`, `title`, `description`).

---

## 11. Payment Gateway & Verification Flow (CRITICAL)
Every `POST` booking endpoint above returns a `razorpayOrder` object.

1. **Checkout**: Open Razorpay UI using `razorpay_order_id`.
2. **Capture**: On success, Razorpay returns `razorpay_payment_id` and `razorpay_signature`.
3. **Verify Payment**: `POST /api/payment/verify`
   - Payload: `{ "orderType": "EPUJA", "orderId": "<database_order_id>", "razorpayPaymentId": "<id>", "razorpayOrderId": "<id>", "razorpaySignature": "<sig>" }`
   - `orderType` must be one of: `EPUJA`, `JYOTISH`, `CHADHAVA`, `KUNDLI`, `ECOMMERCE`, or `OFFER`.
4. **Server Action**: Server marks order as `PAID` and triggers invoicing.

---

## 12. Refer & Earn (Commission & Payouts) Flow

Devotees can refer friends using their unique referral link/code.

### 12.1. Registration with Referral Code
- **Register**: `POST /api/auth/register`
  - Payload adds: `{ ..., "referralCode": "REF12345" }` (optional). If valid, matches the user and records the referrer relationship.

### 12.2. Customer Referral Dashboard APIs
- **Get Referral Stats**: `GET /api/my-referrals/stats`
  - Response: Includes unique referral code, wallet balance (`referralWalletBalance`), counts of total invites and active buyers, lifetime withdrawals, min payout limit, transaction history ledger (`earnings`), and withdrawal request logs (`payouts`).
- **Get Friends List**: `GET /api/my-referrals/friends`
  - Response: Returns a list of referred friends with privacy-masked names/emails (`name: "C****n B*****a"`) and their referral status (`Active Buyer` / `Verified Member` / `Pending Verification`).
- **Request Payout Withdrawal**: `POST /api/my-referrals/payout`
  - Payload: `{ "amount": 1000, "bankHolderName": "...", "bankName": "...", "accountNumber": "...", "ifscCode": "...", "upiId": "..." }`
  - Validation: Validates that balance >= amount, amount >= minimum limit, and that the bank account number / UPI is not already registered under a different user profile (anti-fraud check).

### 12.3. Admin Referral Management APIs
- **Get Payout Requests**: `GET /api/admin/referrals/payouts`
  - Response: List of all pending, approved, paid, and rejected payout requests across the system.
- **Update Payout Request**: `PATCH /api/admin/referrals/payouts/[id]`
  - Payload: `{ "status": "APPROVED" | "PAID" | "REJECTED", "adminNotes": "..." }`
  - Action: Transitions the withdrawal status. If marked as `REJECTED`, the amount is automatically refunded back to the referrer's wallet balance.
- **Manage User Specific Overrides**: `GET` / `PATCH` `/api/admin/referrals/user-overrides/[id]`
  - Payload: `{ "refCommissionSignup": 50, "refCommissionFirst": 150, "refCommissionRecurring": null }` (Leave `null` to fall back and inherit the global default config rates).
