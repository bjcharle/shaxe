# SHAXE - Microblog Platform

A modern microblog application with verified user engagement voting, trending algorithms with time decay, and a sophisticated moderation system.

## Features

- **User Authentication**: KYC-verified and unverified user accounts
- **Engagement Voting**: Like ⬆️, Dislike ⬇️, Share ➜, Shame ⬅️ (verified users only)
- **Shaxe Points Economy**: Earn points through engagement, spend on post shielding
- **Trending Algorithm**: Time-decayed scoring with unique engager threshold
- **Progressive Bans**: 7-level escalation system for negative engagement
- **Hall of Fame & Shame**: Daily, weekly, monthly, yearly, and all-time rankings
- **Post Shielding**: Use Shaxe points to protect posts from bans for 24 hours
- **Age-Gated Content**: Protect minors from adult-oriented posts
- **User Ignoring**: Optionally hide posts from specific users (not blocking)

## Project Structure

```
shaxe/
├── backend/                 # Node.js/Express server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── models/         # Database CRUD operations
│   │   ├── services/       # Business logic (trending, engagement, points)
│   │   ├── middleware/     # Auth, verification, error handling
│   │   └── server.js       # Express app configuration
│   ├── package.json        # Dependencies
│   └── .env.example        # Configuration template
├── frontend/               # React.js client
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page-level components
│   │   ├── styles/         # CSS modules (purple/light gray theme)
│   │   └── App.js          # Root app component
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
└── docs/                   # Documentation
    ├── DATABASE_SCHEMA.md  # PostgreSQL tables and relationships
    ├── TRENDING_ALGORITHM.md # Time-decay scoring formula
    └── API_DESIGN.md       # RESTful API endpoints
```

## Tech Stack

**Backend:**
- Node.js v14+
- Express.js
- PostgreSQL 12+
- JWT authentication
- bcrypt password hashing

**Frontend:**
- React 18
- React Router v6
- Axios HTTP client
- CSS3 (responsive design)

**External Services:**
- KYC API (third-party verification)
- Optional payment gateway (for point purchases)

## Color Scheme

- **Primary Purple**: `#7c3aed`
- **Light Gray**: `#f3f4f6`
- **Accent Colors**: Gold (Fame), Red (Shame), Green (Like), Blue (Share)

## Getting Started

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration (database, JWT secret, etc.)
npm start
```

Backend runs on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000` by default.

### Database Setup

Create PostgreSQL database and run migrations:

```bash
createdb shaxe
psql shaxe < docs/DATABASE_SCHEMA.sql
```

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for table details.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT
- `POST /api/auth/verify-kyc` - Submit KYC verification

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get personalized feed
- `GET /api/posts/trending` - Get trending posts

### Engagement (Verified Users Only)
- `POST /api/engagement/like/:postId` - Like a post
- `POST /api/engagement/dislike/:postId` - Dislike a post
- `POST /api/engagement/share/:postId` - Share a post
- `POST /api/engagement/shame/:postId` - Shame a post

### Shaxe Points
- `GET /api/shaxe-points/balance` - Check user balance
- `POST /api/shaxe-points/shield/:postId` - Shield a post from ban

### Trending & Rankings
- `GET /api/trending/posts` - Get trending posts
- `GET /api/posts/hall-of-fame` - Hall of fame rankings
- `GET /api/posts/hall-of-shame` - Hall of shame rankings

See [API_DESIGN.md](docs/API_DESIGN.md) for complete endpoint documentation.

## Trending Algorithm

Posts are ranked using exponential time decay:

```
Score = (baseEngagement × timeDecay × log(1 + uniqueEngagers))
```

Where:
- `baseEngagement = (likes + shares) - (dislikes + shames)`
- `timeDecay = e^(-hours_old / 24)`
- `uniqueEngagers` = count of unique users who engaged

**Ban Trigger**: When `engagementRatio >= 0.7 AND uniqueEngagers >= 10`

See [TRENDING_ALGORITHM.md](docs/TRENDING_ALGORITHM.md) for details.

## User Roles

### Verified Users
- Full engagement access (like, dislike, share, shame)
- Posts and engagements affect trending
- Can earn and spend Shaxe points
- Can shield posts from bans

### Unverified Users
- Limited to `shaxe_view` engagement (view tracking)
- Engagement doesn't affect trending
- Cannot earn Shaxe points
- Cannot participate in voting

### Banned Users
7-level progressive ban system:
1. **24 hours** (first offense)
2. **72 hours** (second offense)
3. **1 week** (third offense)
4. **2 weeks** (fourth offense)
5. **1 month** (fifth offense)
6. **6 months** (sixth offense)
7. **1 year** (permanent appeal-only)

## Components

### Navbar
Navigation bar with logo, menu, and user profile link.

### ShaxeCard
Individual post card with engagement buttons and statistics.

### Feed
Paginated list of posts with filtering and sorting options.

### HallOfFame / HallOfShame
Ranked lists filtered by time period (day, week, month, year, all-time).

### Profile
User profile page with stats, points balance, and settings.

### Auth Pages
Login and signup forms with KYC verification workflow.

## Development

### Environment Variables

Backend (`.env`):
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/shaxe
JWT_SECRET=your-secret-key
KYC_API_KEY=your-api-key
APP_NAME=Shaxe
```

Frontend (`.env`):
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Running Tests

Backend:
```bash
cd backend
npm test
```

Frontend:
```bash
cd frontend
npm test
```

## Icon Design

The Shaxe icon is an "S" with forward and backward arrows:
- **Up Arrow**: Like engagement
- **Down Arrow**: Dislike engagement
- **Forward Arrow**: Share engagement
- **Backward Arrow**: Shame engagement

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ for the community**
