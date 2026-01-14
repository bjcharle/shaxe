# Shaxe Backend - Complete Setup Guide

## Overview
The Shaxe backend is built with Node.js, Express, and PostgreSQL. This guide walks through setting up the development environment and running the server.

## Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Set Up PostgreSQL Database

### Create Database and User
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shaxe_dev;

# Create user
CREATE USER shaxe_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE shaxe_dev TO shaxe_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO shaxe_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO shaxe_user;

# Exit psql
\q
```

### Alternative: Using psql CLI
```bash
psql -U postgres -c "CREATE DATABASE shaxe_dev;"
psql -U postgres -c "CREATE USER shaxe_user WITH PASSWORD 'your_secure_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE shaxe_dev TO shaxe_user;"
```

## Step 3: Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shaxe_dev
DB_USER=shaxe_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production

# Shaxe Points
SHAXE_POINTS_INITIAL=100

# Trending Algorithm
TRENDING_DECAY_HOURS=24
BAN_THRESHOLD_ENGAGEMENT_RATIO=0.7
```

## Step 4: Run Database Migrations

The migration file creates all necessary tables and indexes.

```bash
# Connect to database and run migration
psql -U shaxe_user -d shaxe_dev -f migrations/000_init_schema.sql
```

Or using Node.js pool:
```bash
node -e "
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const sql = fs.readFileSync('./migrations/000_init_schema.sql', 'utf8');
pool.query(sql, (err, res) => {
  if (err) console.error('Migration error:', err);
  else console.log('Migration completed successfully');
  pool.end();
});
"
```

## Step 5: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## Verify Installation

Test the health endpoint:
```bash
curl http://localhost:5000/health
# Response: { "status": "ok" }
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-kyc` - KYC verification

### Users
- `GET /api/users/:userId` - Get user profile
- `GET /api/users/:userId/posts` - Get user's posts
- `POST /api/users/ignore/:userId` - Ignore user
- `POST /api/users/unignore/:userId` - Unignore user
- `GET /api/users/:userId/ignored` - Get ignored users list

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get feed (paginated)
- `GET /api/posts/:postId` - Get single post
- `POST /api/posts/:postId/comments` - Add comment

### Engagement
- `POST /api/engagement/like/:postId` - Like post
- `POST /api/engagement/dislike/:postId` - Dislike post
- `POST /api/engagement/share/:postId` - Share post
- `POST /api/engagement/shame/:postId` - Shame post (triggers ban logic)
- `DELETE /api/engagement/:postId/:engagementType` - Remove engagement
- `GET /api/engagement/:postId/stats` - Get engagement stats

### Trending
- `GET /api/trending/posts` - Get trending posts
- `GET /api/trending/scores/:postId` - Get trending score for post
- `GET /api/trending/hall-of-fame` - Get hall of fame
- `GET /api/trending/hall-of-shame` - Get hall of shame

### Shaxe Points
- `GET /api/shaxe-points/balance` - Get user's points balance
- `POST /api/shaxe-points/shield/:postId` - Shield post with points
- `POST /api/shaxe-points/purchase` - Purchase points
- `GET /api/shaxe-points/transactions` - Get transaction history

## Database Schema

### Core Tables
1. **users** - User accounts with KYC verification status
2. **posts** - User posts with adult content flagging and shielding
3. **engagement** - Likes, dislikes, shares, shames
4. **user_bans** - Ban records with progressive ban levels (7 levels: 24hr to 1yr)
5. **user_ignores** - Users ignore list
6. **shaxe_points** - User point balances
7. **shaxe_shield_history** - Shield purchase records
8. **shaxe_point_transactions** - Point transaction history
9. **trending_cache** - Cached trending scores for performance
10. **hall_of_fame** - Top posts by period
11. **hall_of_shame** - Most negative posts by period

### Supporting Tables
- **comments** - Post comments
- **post_shares** - Share records
- **user_devices** - Push notification device tokens

## Key Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- KYC verification status tracking

### Engagement System
- 4 engagement types: Like (↑), Dislike (↓), Share (→), Shame (←)
- Only verified users can engage
- Verified users can create posts, unverified can view

### Trending Algorithm
- Time-decay formula: `score = baseEngagement × timeDecay × log(uniqueEngagers)`
- Progressive ban system triggered by high dislike/shame ratio
- 7 ban levels: 24hr → 72hr → 1wk → 2wk → 1mo → 6mo → 1yr

### Shaxe Points System
- Initial balance: 100 points per user
- Shield cost: customizable (default 100 points for 24hr)
- Earned through engagement
- Can be purchased and transferred

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check DB credentials in `.env`
- Verify database and user exist

### Migration Error
```
Error: relation "users" already exists
```
- Database already migrated
- Drop and recreate database:
```bash
dropdb shaxe_dev -U postgres
createdb shaxe_dev -U postgres
psql -U shaxe_user -d shaxe_dev -f migrations/000_init_schema.sql
```

### JWT Token Errors
- Check JWT_SECRET in `.env`
- Ensure token is in Authorization header: `Bearer <token>`
- Verify token hasn't expired (30-day default)

## Development Tips

### Testing with curl
```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass123","dateOfBirth":"2000-01-01"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Create post (requires token)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Hello Shaxe!","isAdultContent":false}'
```

### Using Postman
1. Import the API collection from `docs/`
2. Set environment variables (database, JWT token)
3. Run requests and view responses

## Performance Optimization

### Database Indexes
- All critical foreign keys indexed
- Trending score cached for quick queries
- Engagement queries use indexes on post_id and user_id

### Query Optimization
- Use pagination (limit/offset) on list endpoints
- Trending scores cached to avoid recalculation
- Left joins for optional engagement stats

## Next Steps
1. Set up frontend integration with API
2. Implement push notifications
3. Add rate limiting middleware
4. Set up monitoring and error tracking
5. Configure CI/CD pipeline

## Support
For issues or questions:
- Check logs: `npm run dev` shows real-time logs
- Review error responses for details
- Consult docs/ for detailed specifications
