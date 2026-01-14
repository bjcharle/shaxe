# Shaxe API Design

## Authentication Endpoints

### POST /api/auth/signup
Request:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "verifyNow": boolean
}
```
Response: `{ token, user }`

### POST /api/auth/login
Request: `{ email, password }`
Response: `{ token, user }`

### POST /api/auth/verify-kyc
Request: `{ userId, kycDocuments }`
Response: `{ verificationStatus }`

## Users Endpoints

### GET /api/users/:userId
Response: `{ user, stats: { postCount, engagementCount, shaxePoints } }`

### GET /api/users/:userId/posts
Query params: `?limit=20&offset=0&sort=trending|recent`
Response: `{ posts: [...] }`

### GET /api/users/:userId/ignored
Response: `{ ignoredUsers: [...] }`

### POST /api/users/:userId/ignore/:ignoredUserId
Response: `{ success: true }`

### DELETE /api/users/:userId/ignore/:ignoredUserId
Response: `{ success: true }`

## Posts Endpoints

### POST /api/posts
Request:
```json
{
  "content": "string",
  "isAdultContent": boolean
}
```
Response: `{ post }`

### GET /api/posts/feed
Query params: `?sort=trending|following|recent&period=day|week|month|year|all_time&limit=20&offset=0`
Response: `{ posts: [...] }`

### GET /api/posts/trending
Query params: `?period=day|week|month|year&limit=10`
Response: `{ posts: [...] }`

### GET /api/posts/hall-of-fame
Query params: `?period=day|week|month|year|all_time`
Response: `{ posts: [...] }`

### GET /api/posts/hall-of-shame
Query params: `?period=day|week|month|year|all_time`
Response: `{ posts: [...] }`

## Engagement Endpoints

### POST /api/engagement/like/:postId
Requires: verified user, not under 18 if adult content
Response: `{ engagement }`

### POST /api/engagement/dislike/:postId
Response: `{ engagement }`

### POST /api/engagement/share/:postId (retweet)
Response: `{ engagement }`

### POST /api/engagement/shame/:postId
Response: `{ engagement }`

### POST /api/engagement/shaxe-view/:postId
For unverified users only
Response: `{ engagement }`

### GET /api/posts/:postId/engagement
Response: `{ likes, dislikes, shares, shames, shaxeViews, uniqueEngagers }`

## Shaxe Points Endpoints

### GET /api/shaxe-points/balance
Response: `{ balance, earned, spent }`

### POST /api/shaxe-points/shield/:postId
Request: `{ pointsToUse }`
Response: `{ shieldExpires }`

### GET /api/shaxe-points/market
Response: `{ listings: [ { userId, amount, pricePerPoint } ] }`

### POST /api/shaxe-points/buy/:sellerId
Request: `{ amount, pricePerPoint }`
Response: `{ transaction }`

### POST /api/shaxe-points/purchase
Request: `{ amount }` (from app, payment required)
Response: `{ transaction }`

## Trending Endpoints

### GET /api/trending/posts
Query params: `?period=hour|day|week&limit=20`
Response: `{ posts: [...] }`

### GET /api/trending/scores/:postId
Response: `{ postId, trendingScore, breakdown: { engagement, timeDecay, uniqueEngagers } }`
