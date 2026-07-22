# Mandir Setu Mobile App - Replicated APK Backend API Specification

This document details all API endpoints, routes, request formats, and authentication structures extracted directly from **`MS-1.0.65.apk`**.

---

## 🔐 1. Authentication Endpoints

* **Verify Login OTP**: `POST /api/auth/verify-login-otp`
  * Body: `{ "email": "devotee@mandirsetu.com", "otp": "123456" }`
* **Sign Out**: `POST /api/auth/signout`
* **Validate Mail**: `POST /api/user/validate-mail`

---

## 🪔 2. E-Puja & Temple Endpoints

* **Puja Listings**: `GET /api/puja/upcoming-list`
* **Puja Details**: `GET /api/puja/details/:id`
* **Temple Directory**: `GET /api/temple/list`
* **Latest Temple Videos**: `GET /api/temple/latest-videos`
* **Darshan Slot Availability**: `GET /api/darshan/time-slot-availability`

---

## 🔮 3. Astrologer / Jyotish Endpoints

* **Astrologer Dashboard**: `GET /api/astrologer/dashboard-detail`
* **Astrologer Details**: `GET /api/astrologer/details-by-id?id=:id`
* **Astrologer Categories**: `GET /api/astrologer/categories`
* **Astrologer Languages**: `GET /api/astrologer/language-list`
* **Astrologer Session Booking**: `POST /api/astrologer/session`
* **Accept Call**: `POST /api/astrologer/call/accept`
* **End Call**: `POST /api/astrologer/call/end`

---

## 🔯 4. Kundali Endpoints

* **Kundali Packages**: `GET /api/kundali/packages`
* **Initiate Kundali Payment**: `POST /api/kundali/initiate-payment`
* **Confirm Kundali Payment**: `POST /api/kundali/confirm-payment`

---

## 🛒 5. Product & E-Commerce Endpoints

* **Product Directory**: `GET /api/product`
* **Product Tags**: `GET /api/product/tags`
* **Price Range**: `GET /api/product/price-range`
* **Initiate Order**: `POST /api/order/initiate-order`
* **Place Order**: `POST /api/order/place-order`
* **My Orders List**: `GET /api/order/list`
* **My Bookings List**: `GET /api/booking/list`
* **Upcoming Bookings**: `GET /api/booking/upcoming`

---

## 📢 6. Banner & Common Endpoints

* **Banners**: `GET /api/banner/list`
* **Devotional Content**: `GET /api/common/devotional-content-list`
* **FAQs**: `GET /api/faq/list`
* **Contact Us**: `POST /api/common/contact-us`
* **Terms of Use**: `GET /api/common/terms-of-use`
* **Privacy Policy**: `GET /api/common/privacy-policy`
* **Geotag User Action**: `POST /api/geotag/user-action`
* **Register Push Token**: `POST /api/notification/register-token`
