# Quick Start Guide

Get Shaxe up and running in 5 minutes.

## Prerequisites

- Node.js v14+
- PostgreSQL 12+
- Git

## Backend Setup (Terminal 1)

```bash
cd shaxe/backend
npm install
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your editor

npm start
```

Backend runs at `http://localhost:5000`

## Database Setup

```bash
# Create PostgreSQL database
createdb shaxe

# (Optional) Seed initial data
psql shaxe < migrations/seed.sql
```

## Frontend Setup (Terminal 2)

```bash
cd shaxe/frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

Frontend runs at `http://localhost:3000`

## Test the App

1. **Signup**: Go to `http://localhost:3000/signup`
2. **Create Account**: Enter username, email, password, DOB
3. **Verify KYC**: Submit ID verification (demo skips this)
4. **Login**: Use your credentials
5. **Post**: Click "Compose Shaxe" to create a post
6. **Engage**: Use engagement buttons to like/dislike/share/shame
7. **Trending**: Check Hall of Fame for top posts

## Project Structure

```
shaxe/
├── backend/          # Node.js/Express API server
├── frontend/         # React.js web client
├── docs/             # API specs, schema, algorithms
└── README.md         # Full documentation
```

## Available Routes

**Development URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API: http://localhost:5000/api

**Key Pages:**
- `/` - Feed
- `/signup` - Register
- `/login` - Login
- `/hall-of-fame` - Hall of Fame
- `/hall-of-shame` - Hall of Shame
- `/profile/:userId` - User Profile

## Troubleshooting

**Backend won't start:**
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Try: `npm install` again

**Frontend shows blank page:**
- Check if backend is running
- Clear browser cache: Ctrl+Shift+Delete
- Check console for errors: F12

**Port conflicts:**
- Backend port: Change `PORT` in `.env`
- Frontend port: `PORT=3001 npm start`

## Next Steps

1. Read [./docs/API_DESIGN.md](./docs/API_DESIGN.md) for full API reference
2. Read [./docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) for data model
3. Read [./docs/TRENDING_ALGORITHM.md](./docs/TRENDING_ALGORITHM.md) for scoring rules

## Support

See main [README.md](./README.md) for full documentation.
