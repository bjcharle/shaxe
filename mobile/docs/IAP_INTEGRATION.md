Shaxe Mobile - In-App Purchases (IAP) Integration Guide

This document explains how to wire native in-app purchases for Shaxe points.

Overview
- We use `expo-in-app-purchases` in the Expo managed workflow (SDK 48).
- Purchases must be configured in Google Play Console and App Store Connect.
- Backend must validate receipts and credit points to users.

1) Configure Products
- Create non-consumable/consumable products for points (e.g., `shaxe_points_pack_1`).
- Note product IDs and add them to your app configuration.

2) Client Setup
- Install: `expo install expo-in-app-purchases`
- Initialize and set purchase listener (see `mobile/src/screens/ShaxePoints.js`).
- On purchase result, send `transactionReceipt` and `productId` to backend endpoint `/shaxe-points/purchase` for verification.

3) Backend Fulfillment
- Endpoint: `POST /api/shaxe-points/purchase`
  - Body: `{ productId, receipt }
  - Validate receipt with Apple/Google servers.
  - Credit shaxe points to user account on success.
  - Return 200 with updated balance.

4) Testing
- Android: use internal testing track and license testers; use static test product IDs if needed.
- iOS: use Sandbox testers and TestFlight.

5) Security
- Validate receipts server-side; do not trust client-side receipts.
- Keep mapping of productId -> points in backend config.

6) Fallback (server-side purchase)
- Provide an endpoint `/shaxe-points/purchase` for server-side purchases (e.g., user pays by card via Stripe) and credit points similarly.

7) Points Transfer / Marketplace
- Transfers should be gated with confirmations and anti-fraud limits.
- Log all transactions in `shaxe_point_transactions` table.

8) Shielding
- Shield endpoint: `POST /api/shaxe-points/shield/:postId` with `{ points }` and JWT auth.
- Deduct points and create `shaxe_shield_history` entry with expiry (24h).

Notes
- App Store review requires clear purchase flow and refund policy.
- KYC rules may be required for money flows depending on jurisdiction.

