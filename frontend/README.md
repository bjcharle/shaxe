# Shaxe Frontend

A React-based web application for the Shaxe microblogging platform.

## Features

- User authentication (login/signup)
- KYC verification flow
- Post feed and creation
- User profiles
- Admin dashboard
- Points system
- Content reporting

## Tech Stack

- React 18
- React Router v6
- Axios for API calls
- JWT authentication
- CSS Modules for styling

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm start
   ```

## Production Build

```bash
npm run build
```

## Environment Variables

- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_ENV`: Environment (development/production)

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page-level components
├── context/       # React context providers
├── hooks/         # Custom hooks
├── services/      # API service functions
├── styles/        # CSS stylesheets
└── utils/         # Utility functions
```
