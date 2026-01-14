# Backend Implementation Complete

## ✅ Implemented Endpoints

### Authentication (`POST /api/auth/*`)
- **`POST /signup`** — Register new user with email, password, DOB
  - Returns JWT token and user data
  - Password hashed with bcrypt
  
- **`POST /login`** — Authenticate with email/password
  - Returns JWT token for authenticated requests
  
- **`POST /verify-kyc`** — KYC verification (placeholder)
  - Accepts ID document and proof of address
  - Auto-approves in development mode
  - TODO: Integrate real KYC service (Jumio, IDology)

### Posts (`GET/POST /api/posts/*`)
- **`POST /posts`** — Create new post (requires auth)
  - Accepts `content` and optional `isAdultContent` flag
  
- **`GET /posts/feed`** — Get chronological feed (public)
  - Paginated with `limit` and `offset` query params
  - Shows engagement counts (likes, dislikes, shares, shames)
  
- **`GET /posts/trending`** — Get trending posts (public)
  - Uses exponential time-decay + engagement algorithm
  - Paginated with `limit` and `offset`

### Engagement (`POST /api/engagement/*`)
- **`POST /engagement/like/:postId`** — Like a post
- **`POST /engagement/dislike/:postId`** — Dislike a post
- **`POST /engagement/share/:postId`** — Share a post
- **`POST /engagement/shame/:postId`** — Shame a post (verified users only)

All engagement endpoints:
- Require authentication
- Check user ban status
- Auto-trigger trending recalculation
- Shame action requires `is_verified = true`

### Shaxe Points (`GET/POST /api/shaxe-points/*`)
- **`GET /balance`** — Get user's Shaxe points balance (auth required)
- **`POST /purchase`** — Purchase points with IAP receipt (auth required)
  - Maps productId → points (small: 100, medium: 550, large: 1200)
  - TODO: Validate receipt with Apple/Google servers
- **`POST /shield/:postId`** — Shield post with points (auth required)
  - Deducts points from balance
  - Creates 24-hour shield on post

## 🔐 Authentication Flow

1. Client calls `POST /signup` or `POST /login`
2. Server returns JWT token in response
3. Client stores token in AsyncStorage (mobile) or localStorage (web)
4. Client includes token in `Authorization: Bearer <token>` header
5. Server middleware (`authenticateToken`) verifies JWT and sets `req.user`
6. Routes access `req.user.userId` for user context

## 📊 Database Models

### Users Table
- id, username, email, password_hash, date_of_birth
- is_verified, kyc_status, ban_until
- created_at, updated_at

### Posts Table
- id, user_id, content, is_adult_content
- is_banned, is_shielded, shield_expires_at
- created_at, updated_at

### Engagement Table
- id, post_id, user_id, engagement_type (like/dislike/share/shame)
- created_at

### Shaxe Points Table
- user_id, balance, total_earned, total_spent

### Trending Cache Table
- post_id, trending_score, calculated_at

## 🚀 Environment Variables

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shaxe
DB_USER=postgres
DB_PASSWORD=your-password
SHAXE_POINTS_INITIAL=100
```

## 📝 Services

### ShaxePointsService
- `getBalance(userId)` — Get user's balance (create if not exists)
- `usePoints(userId, amount, postId)` — Deduct points for shield
- `addPoints(userId, amount, type)` — Add points to balance
- `transferPoints(fromUserId, toUserId, amount)` — Transfer between users

### EngagementService
- `addEngagement(userId, postId, type)` — Record engagement
- `getEngagementStats(postId)` — Get engagement counts
- `removeEngagement(userId, postId, type)` — Remove engagement

### TrendingService
- `calculateTrendingScore(postId)` — Compute score with time-decay
- `updateTrendingCache(postId)` — Update trending table
- `getTrendingPosts(limit, offset, period)` — Get trending posts
- `handleBan(postId)` — Progressive ban logic (24h → 72h → 1w → 2w → 1mo → 6mo → 1y)

## 🧪 Testing with cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","dateOfBirth":"2000-01-01"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create Post (with token)
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello Shaxe!","isAdultContent":false}'

# Get Feed
curl http://localhost:5000/api/posts/feed?limit=10&offset=0

# Get Trending
curl http://localhost:5000/api/posts/trending?limit=10

# Like a post (auth required)
curl -X POST http://localhost:5000/api/engagement/like/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ⚠️ TODOs

- [ ] Validate IAP receipts with Apple/Google servers in `POST /purchase`
- [ ] Integrate real KYC service (Jumio, IDology) in `POST /verify-kyc`
- [ ] Implement rate limiting on engagement endpoints
- [ ] Add email verification flow after signup
- [ ] Implement password reset endpoint
- [ ] Add user profile endpoints (GET/POST /users/:userId)
- [ ] Add ban escalation to update user's `ban_until` field
- [ ] Add scheduled job to recalculate trending cache hourly

## 📱 Mobile Integration

Mobile app (`mobile/src/services/api.js`) is pre-configured to call these endpoints:
- `POST /api/auth/signup` (Signup screen)
- `POST /api/auth/login` (Login screen)
- `POST /api/auth/verify-kyc` (KYC screen)
- `GET /api/posts/feed` (Feed screen)
- `POST /api/posts` (Create post)
- `POST /api/engagement/*` (ShaxeCard engagement handlers)
- `GET/POST /api/shaxe-points/*` (ShaxePoints screen)

**Update `API_BASE` in mobile after deploying backend URL.**
