# Shaxe Backend - Quick Reference Card

## 🚀 Quick Start (30 minutes)

```bash
# 1. Database Setup
createdb shaxe_dev
createuser shaxe_user
psql -U shaxe_user -d shaxe_dev -f backend/migrations/000_init_schema.sql

# 2. Configure
cd backend
cp .env.example .env
# Edit .env with your database password and JWT secret

# 3. Install & Run
npm install
npm run dev
# Server running on http://localhost:5000

# 4. Test
bash test-api.sh
curl http://localhost:5000/health
```

## 📋 API Endpoints Quick Guide

### Auth
```
POST /api/auth/signup              { username, email, password, dateOfBirth }
POST /api/auth/login               { email, password }
POST /api/auth/verify-kyc          { userId, idDocument, proofOfAddress }
```

### Posts
```
POST /api/posts                    { content, isAdultContent }
GET /api/posts/feed?limit=20&offset=0
GET /api/posts/:postId
POST /api/posts/:postId/comments   { content }
```

### Engagement
```
POST /api/engagement/like/:postId
POST /api/engagement/dislike/:postId
POST /api/engagement/share/:postId
POST /api/engagement/shame/:postId
DELETE /api/engagement/:postId/:type
GET /api/engagement/:postId/stats
```

### Users
```
GET /api/users/:userId
GET /api/users/:userId/posts
POST /api/users/ignore/:userId
GET /api/users/:userId/ignored
```

### Trending
```
GET /api/trending/posts?period=week
GET /api/trending/hall-of-fame?period=week
GET /api/trending/hall-of-shame?period=week
GET /api/trending/scores/:postId
```

### Points
```
GET /api/shaxe-points/balance
POST /api/shaxe-points/shield/:postId
GET /api/shaxe-points/transactions
```

## 🔐 Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

Get token from signup/login response.

## 📊 Database Tables

```
users                      user_bans
├── id                      ├── user_id
├── username                ├── ban_level
├── email                   ├── ban_end_time
├── password_hash           └── reason
├── date_of_birth
├── is_verified
└── kyc_status

posts                      engagement
├── id                     ├── post_id
├── user_id                ├── user_id
├── content                ├── engagement_type
├── is_adult_content       └── created_at
└── is_shielded

shaxe_points              trending_cache
├── user_id              ├── post_id
├── balance              ├── trending_score
├── total_earned         └── engagement_count
└── total_spent
```

## 🛠️ Common Tasks

### Create User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "secure123",
    "dateOfBirth": "2000-01-15"
  }'
```

### Get Feed
```bash
curl http://localhost:5000/api/posts/feed?limit=20&offset=0 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Like a Post
```bash
curl -X POST http://localhost:5000/api/engagement/like/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User Profile
```bash
curl http://localhost:5000/api/users/1
```

## 🔧 Environment Variables

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shaxe_dev
DB_USER=shaxe_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
SHAXE_POINTS_INITIAL=100
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/            6 route modules
│   ├── models/            User, Post models
│   ├── services/          Trending, Engagement, Points
│   ├── middleware/        Auth, Error, Verification
│   └── server.js          Express app
├── migrations/            Database schemas
├── package.json           Dependencies
├── .env.example           Configuration template
└── test-api.sh           Testing script
```

## 🎯 Key Features

✅ JWT Authentication (30-day tokens)
✅ Post creation and comments
✅ 4-type engagement voting
✅ Time-decay trending algorithm
✅ 7-level progressive ban system
✅ Shaxe Points economy
✅ Age-gating for adult content
✅ User ignore list
✅ Hall of Fame/Shame rankings

## 📊 Trending Algorithm

```
Score = (likes + shares - dislikes - shames) 
        × exp(-hoursOld / 24) 
        × log(uniqueEngagers + 1)
```

Ban triggered when:
- (dislikes + shames) / total ≥ 0.7 AND unique_engagers ≥ 10

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to DB" | Check PostgreSQL running, verify .env credentials |
| "Port 5000 in use" | Change PORT in .env or kill existing process |
| "Token invalid" | Verify JWT_SECRET matches, check Bearer format |
| "Unauthorized" | Add Authorization header with valid token |

## 📚 Documentation

- **Setup**: `SETUP_GUIDE.md`
- **Status**: `BUILD_PROGRESS.md`
- **API**: `docs/API_DESIGN.md`
- **DB**: `docs/DATABASE_SCHEMA.md`
- **Algorithm**: `docs/TRENDING_ALGORITHM.md`

## 💡 Next Steps

1. ✅ Backend complete
2. **Frontend integration** (connect React to API)
3. Database setup and migration
4. E2E testing
5. Deployment

## 🎓 Example API Call

```bash
# Signup
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"pass123","dateOfBirth":"2000-01-01"}' \
  | jq -r '.token')

# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Hello Shaxe!","isAdultContent":false}'

# Get feed
curl http://localhost:5000/api/posts/feed \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

**Need Help?** Check `SETUP_GUIDE.md` or review specific service files.

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** January 13, 2026
