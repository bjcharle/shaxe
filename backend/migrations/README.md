# Migration Scripts Template

This file documents how to set up database migrations. Create actual migration files as needed.

## Initial Schema Migration

File: `001_init_schema.sql`

Runs all table creation from DATABASE_SCHEMA.md:
- users table with KYC status
- posts table with shielding
- engagement tracking
- shaxe points system
- trending cache
- hall of fame/shame tables
- bans and ignores tables

## Seed Data Migration

File: `002_seed_demo_data.sql`

Inserts demo users, posts, and engagements for testing:
- 5 test users (mix of verified/unverified)
- 20 sample posts
- 100+ engagement records
- Trending scores pre-calculated

## Usage

Run migrations in order:
```bash
psql shaxe < 001_init_schema.sql
psql shaxe < 002_seed_demo_data.sql
```

Or from Node.js:
```javascript
const fs = require('fs');
const { pool } = require('./src/models/database');

async function runMigrations() {
  const migration = fs.readFileSync('./migrations/001_init_schema.sql', 'utf8');
  await pool.query(migration);
}

runMigrations();
```

## Creating New Migrations

1. Create file: `migrations/NNN_description.sql`
2. Write SQL statements
3. Test with: `psql shaxe < migrations/NNN_description.sql`
4. Document changes

Example structure:
```sql
-- Migration: Add new column
-- Description: Adds metadata column to posts table

ALTER TABLE posts ADD COLUMN metadata JSONB DEFAULT '{}';
CREATE INDEX idx_posts_metadata ON posts USING GIN (metadata);
```

## Rollback

To revert migrations, create corresponding down migrations or manually undo:

```bash
# Drop and recreate
dropdb shaxe
createdb shaxe
psql shaxe < 001_init_schema.sql
```
