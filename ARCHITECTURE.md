# Shaxe Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SHAXE SYSTEM DIAGRAM                      │
└─────────────────────────────────────────────────────────────┘

CLIENTS
│
├── Web Browser (React Frontend)
│   ├── http://localhost:3000
│   ├── Components: Navbar, ShaxeCard, Feed, Profile
│   └── Pages: Login, Signup, HallOfFame, HallOfShame
│
└── Mobile App (React Native - Future)

                    HTTP/REST API
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼

BACKEND (Node.js/Express)              EXTERNAL SERVICES
Port 5000                               │
│                                       ├── KYC Provider API
├── Auth Service                        ├── Email Service (Future)
│   ├── Signup Route                    └── Payment Gateway (Future)
│   ├── Login Route
│   └── KYC Verification
│
├── Post Service
│   ├── Create Post
│   ├── Get Feed
│   ├── Get Trending
│   └── Delete Post
│
├── Engagement Service
│   ├── Like Post
│   ├── Dislike Post
│   ├── Share Post
│   ├── Shame Post
│   └── Calculate Stats
│
├── Trending Service
│   ├── Calculate Scores
│   ├── Apply Bans
│   ├── Update Cache
│   └── Generate Rankings
│
├── Points Service
│   ├── Get Balance
│   ├── Award Points
│   ├── Spend Points
│   └── Transfer Points
│
└── Middleware Layer
    ├── JWT Auth
    ├── KYC Verification
    ├── Age Gating
    ├── Rate Limiting
    └── Error Handling

                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼

   DATABASE (PostgreSQL)           CACHE LAYER (Optional)
   │                               │
   ├── users                       ├── Trending Scores
   ├── posts                       ├── User Sessions
   ├── engagement                  └── Feed Cache
   ├── shaxe_points
   ├── user_bans
   ├── shaxe_shield_history
   ├── user_ignores
   ├── post_shares
   ├── trending_cache
   ├── hall_of_fame
   └── hall_of_shame
```

## Data Flow Diagram

```
USER INTERACTION FLOW
═════════════════════

1. SIGNUP
   User → [Signup Form] → POST /api/auth/signup → 
   [Auth Service] → [User Model] → 
   [Database: Create User] → JWT Token → User

2. POST CREATION
   User → [Compose] → POST /api/posts → 
   [Post Service] → [Post Model] → 
   [Database: Insert Post] → Post ID → [Trending Cache]

3. ENGAGEMENT (VOTING)
   User → [Like Button] → POST /api/engagement/like/{postId} →
   [Auth Middleware: Verify JWT] →
   [KYC Middleware: Check Verified] →
   [Engagement Service] → [Database: Log Engagement] →
   [Trending Service: Recalculate] → 
   [Update Trending Cache] → Updated Stats → UI

4. TRENDING CALCULATION
   [Scheduled Job or On-Demand] →
   [Trending Service] →
   For Each Post:
     - Get All Engagements
     - Calculate Time Decay: e^(-hours_old/24)
     - Count Unique Engagers
     - Apply Formula: score × decay × log(engagers)
     - Check Ban Threshold: ratio >= 0.7 AND engagers >= 10
     - If Ban: Apply Progressive Ban
     - If Top Post: Add to Hall of Fame
   → [Update trending_cache Table] →
   [Database: Update Scores]

5. FEED RETRIEVAL
   User → GET /api/posts/feed →
   [Post Service] →
   - Get User's Posts
   - Get Followed Users' Posts
   - Exclude Ignored Users
   - Apply Age Gating
   - Sort by Trending Score/Newest
   - Paginate Results
   → [Database: Query with Joins] →
   [Engagement Stats: Count Likes/Dislikes] →
   Return Posts with Stats → UI

6. HALL OF FAME
   User → GET /api/posts/hall-of-fame?period=day →
   [Trending Service] →
   [Query trending_cache] →
   Filter Posts by:
     - Is Not Banned
     - Created in Period
     - Score > Threshold
   Sort by Score DESC →
   Return Top 50 Posts → UI
```

## Database Relationships

```
┌──────────────┐         ┌────────────────┐
│    users     │◄────────┤     posts      │
├──────────────┤ user_id ├────────────────┤
│ id (PK)      │         │ id (PK)        │
│ username     │         │ user_id (FK)   │
│ email        │         │ content        │
│ is_verified  │         │ is_shielded    │
│ kyc_status   │         │ shield_end     │
└──────────────┘         └────┬───────────┘
       ▲                      │
       │                      │ (1:Many)
       │                      ▼
       │              ┌──────────────────┐
       │              │   engagement     │
       │              ├──────────────────┤
       │              │ id (PK)          │
       │              │ post_id (FK)     │
       │              │ user_id (FK)─────┤──────┐
       │              │ type (like/etc)  │      │
       │              └──────────────────┘      │
       │                                        │
       │      ┌─────────────────────────────────┘
       │      │
       ├──────┴─────────────┐
       │                    │
┌──────┴─────────┐   ┌──────┴──────────────┐
│  user_bans     │   │  shaxe_points      │
├────────────────┤   ├────────────────────┤
│ id (PK)        │   │ id (PK)            │
│ user_id (FK)   │   │ user_id (FK)       │
│ ban_level      │   │ balance            │
│ ban_end_time   │   │ total_earned       │
└────────────────┘   │ total_spent        │
                     └────────────────────┘
                            │
       ┌────────────────────┘
       │
       ▼
┌────────────────────────┐
│ shaxe_shield_history   │
├────────────────────────┤
│ id (PK)                │
│ post_id (FK)           │
│ user_id (FK)           │
│ points_used            │
│ shield_end_time        │
└────────────────────────┘
```

## Trending Algorithm Visualization

```
SCORING FORMULA
═══════════════

Score = BaseEngagement × TimeDecay × Uniqueness

Where:

  BaseEngagement = (Likes + Shares) - (Dislikes + Shames)
  
        Example: 100 likes + 10 shares - 30 dislikes - 5 shames
                = 110 - 35 = 75

  TimeDecay = e^(-hours_old / 24)
  
        Example: Post is 24 hours old
                e^(-24/24) = e^(-1) = 0.368
                (Reduces score by ~63%)

  Uniqueness = log(1 + UniquEngagers)
  
        Example: 50 unique people engaged
                log(1 + 50) = log(51) = 3.93
                (Prevents bot spam)

  FINAL: 75 × 0.368 × 3.93 = 108.6

BAN TRIGGER
═══════════

When BOTH conditions are true:
  ├── Engagement Ratio >= 70%
  │   (More dislikes+shames than likes+shares)
  │
  └── Unique Engagers >= 10
      (Not just 1-2 haters)

    ➜ Apply Ban Level X

PROGRESSIVE BAN LEVELS
══════════════════════

Ban 1: 24 hours   ├── First offense (quick recovery)
Ban 2: 72 hours   ├── Second offense
Ban 3: 1 week     ├── User pattern detected
Ban 4: 2 weeks    ├── Moderate repeat
Ban 5: 1 month    ├── Serious offender
Ban 6: 6 months   ├── Very serious
Ban 7: 1 year     └── Permanent appeal-only

POINTS SHIELD MECHANIC
══════════════════════

User has 1000 Shaxe Points
    │
    ├─► Click Shield Post
    │   ├─► Costs 100 Points (configurable)
    │   └─► 24-hour protection from ban
    │       (Ban triggers skip this post)
    │
    └─► Balance becomes 900 Points
```

## Frontend Component Tree

```
App
├── Navbar
│   ├── Logo
│   ├── Menu
│   └── UserProfile
│
├── Routes
│   │
│   ├── / (Feed)
│   │   ├── FeedHeader
│   │   ├── ComposeButton
│   │   └── PostList
│   │       └── ShaxeCard (×N)
│   │           ├── AuthorInfo
│   │           ├── PostContent
│   │           ├── EngagementStats
│   │           └── ActionButtons
│   │               ├── LikeBtn (⬆️)
│   │               ├── DislikeBtn (⬇️)
│   │               ├── ShareBtn (➜)
│   │               └── ShameBtn (⬅️)
│   │
│   ├── /login (Login)
│   │   └── LoginForm
│   │       ├── EmailInput
│   │       ├── PasswordInput
│   │       └── LoginButton
│   │
│   ├── /signup (Signup)
│   │   └── SignupForm
│   │       ├── UsernameInput
│   │       ├── EmailInput
│   │       ├── PasswordInput
│   │       ├── DOBInput
│   │       ├── SignupButton
│   │       └── KYCVerification
│   │
│   ├── /hall-of-fame (Fame)
│   │   ├── PeriodFilter
│   │   │   ├── DayBtn
│   │   │   ├── WeekBtn
│   │   │   ├── MonthBtn
│   │   │   ├── YearBtn
│   │   │   └── AllTimeBtn
│   │   └── RankingList
│   │       └── RankItem (×50)
│   │           ├── Rank (#1-50)
│   │           ├── PostInfo
│   │           └── TrendingScore
│   │
│   ├── /hall-of-shame (Shame)
│   │   ├── PeriodFilter
│   │   └── RankingList
│   │       └── ShameItem (×50)
│   │           ├── Rank (#1-50)
│   │           ├── PostInfo
│   │           └── NegativeScore
│   │
│   └── /profile/:userId (Profile)
│       ├── ProfileHeader
│       │   ├── Avatar
│       │   ├── Username
│       │   └── VerifiedBadge
│       ├── UserStats
│       │   ├── PostCount
│       │   ├── FollowerCount
│       │   ├── FollowingCount
│       │   └── ShaxePoints
│       └── ActionButtons
│           ├── EditProfileBtn
│           └── SettingsBtn
```

## API Endpoint Overview

```
Authentication
  POST   /api/auth/signup
  POST   /api/auth/login
  POST   /api/auth/verify-kyc

User Management
  GET    /api/users/:userId
  GET    /api/users/:userId/posts
  POST   /api/users/ignore/:userId
  POST   /api/users/unignore/:userId

Posts
  POST   /api/posts
  GET    /api/posts/feed
  GET    /api/posts/:postId
  GET    /api/posts/trending

Engagement (Verified Users Only)
  POST   /api/engagement/like/:postId
  POST   /api/engagement/dislike/:postId
  POST   /api/engagement/share/:postId
  POST   /api/engagement/shame/:postId
  DELETE /api/engagement/:engagementId
  GET    /api/engagement/:postId/stats

Trending & Rankings
  GET    /api/trending/posts
  GET    /api/trending/scores/:postId
  GET    /api/posts/hall-of-fame
  GET    /api/posts/hall-of-shame

Shaxe Points
  GET    /api/shaxe-points/balance
  POST   /api/shaxe-points/shield/:postId
  GET    /api/shaxe-points/transactions
  POST   /api/shaxe-points/transfer/:userId
```

## Color Palette

```
Primary Colors
  Purple:     #7c3aed (Navbar, Buttons, Links)
  Light Gray: #f3f4f6 (Background, Secondary)
  Dark Gray:  #1f2937 (Text)

Semantic Colors
  Success:    #10b981 (Positive engagement)
  Danger:     #ef4444 (Negative engagement, Shame)
  Warning:    #f59e0b (Caution, Age-gated)
  Info:       #3b82f6 (Share, Information)
  Gold:       #fbbf24 (Hall of Fame)

Neutral
  Border:     #e5e7eb
  Hover:      #f9fafb
  Disabled:   #d1d5db
```

## Deployment Architecture

```
Production Environment
═════════════════════

┌─────────────────────────────────────────────────┐
│           Cloudflare / CDN                      │
│          (Optional: Caching)                    │
└─────────────────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼

Frontend (React)      Backend (Node.js)
Vercel/Netlify        Heroku/AWS/DO
    │                      │
    └──────────────────────┘
              │
              ▼
    PostgreSQL Database
    (AWS RDS / Heroku)
              │
              ├─► Read Replicas (Optional)
              └─► Backups (Automated)

Monitoring
  ├─► Sentry (Error tracking)
  ├─► DataDog (Performance)
  └─► CloudWatch (Logs)
```

---

**For detailed information, see:**
- [API_DESIGN.md](docs/API_DESIGN.md) - Complete API reference
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Database tables
- [TRENDING_ALGORITHM.md](docs/TRENDING_ALGORITHM.md) - Scoring logic
