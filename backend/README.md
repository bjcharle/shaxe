# Backend Setup Guide

## Prerequisites

- Node.js v14 or higher
- npm or yarn
- PostgreSQL 12+

## Installation Steps

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   - Database URL
   - JWT secret
   - KYC API credentials
   - Application settings

3. **Setup Database**
   ```bash
   # Create database
   createdb shaxe
   
   # Run migrations (to be created)
   psql -U postgres -d shaxe -f migrations/001_init_schema.sql
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Server runs at `http://localhost:5000`

## Project Structure

```
backend/
├── src/
│   ├── routes/              # API route handlers
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── posts.routes.js
│   │   ├── engagement.routes.js
│   │   ├── trending.routes.js
│   │   └── shaxePoints.routes.js
│   ├── models/              # Database models & CRUD
│   │   ├── database.js      # PostgreSQL pool
│   │   ├── User.js
│   │   └── Post.js
│   ├── services/            # Business logic
│   │   ├── TrendingService.js
│   │   ├── EngagementService.js
│   │   └── ShaxePointsService.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js
│   │   ├── verification.js
│   │   ├── ageGating.js
│   │   └── errorHandler.js
│   ├── utils/               # Helper functions
│   └── server.js            # Express app configuration
├── migrations/              # Database schema migrations
├── package.json
├── .env.example
└── README.md
```

## Available Scripts

- `npm start` - Run production server
- `npm run dev` - Run with nodemon for development
- `npm test` - Run test suite
- `npm run migrate` - Run database migrations

## API Endpoints

See [../docs/API_DESIGN.md](../docs/API_DESIGN.md) for complete endpoint documentation.

## Database Schema

See [../docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) for table descriptions and relationships.

## Trending Algorithm

See [../docs/TRENDING_ALGORITHM.md](../docs/TRENDING_ALGORITHM.md) for scoring formula and ban logic.

## Authentication

JWT tokens are issued on login and required for authenticated routes.

Include token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Error Handling

All errors are handled by the global error handler middleware. API returns JSON with `error` field:

```json
{
  "error": "Error description"
}
```

HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Next Steps

1. Implement route handlers using service layer
2. Add database migration scripts
3. Implement KYC verification integration
4. Add comprehensive error handling and validation
5. Write unit and integration tests
6. Setup CI/CD pipeline

## Troubleshooting

**Database Connection Error:**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**Port Already in Use:**
- Change PORT in .env
- Or kill process: `lsof -ti:5000 | xargs kill -9`

**Module Not Found:**
- Run `npm install` again
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## Support

For issues, see the main README or open an issue on GitHub.
