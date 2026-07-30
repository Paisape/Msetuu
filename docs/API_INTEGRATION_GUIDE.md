# Complete API Integration Guide

This document outlines the expected flows, payloads, and integration steps for all modules in the Mandirsetuu frontend application.

## 1. Base URL & Image Loading
- **API Base URL**: `[YOUR_SERVER_URL]` (e.g., `https://api.mandirsetuu.com` or your Coolify domain).
- **Image URLs**: If the API returns a relative path starting with `/uploads/` (e.g., `/uploads/banners/hero.png`), prepend your API Base URL to it when rendering.

---

## 2. Auth Flow (Login & Registration)
- **Send OTP**: `POST /api/auth/send-otp` 
  - Payload: `{ "contact": "email@example.com", "purpose": "LOGIN" }` (purpose can be `LOGIN` or `REGISTER`).
- **Verify OTP**: `POST /api/auth/verify-otp`
  - Payload: `{ "contact": "email@example.com", "otp": "123456", "purpose": "LOGIN" }`
  - Response: Includes your Bearer token and user object.

---

## 3. Profile & Core APIs
- **Edit Profile**: `PUT /api/profile` (Payload: `name`, `email`, `phone`, `dob`, `gender`)
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
