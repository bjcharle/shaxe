# Railway.com Deployment Guide

## Overview
This guide walks you through deploying the Shaxe application to Railway.com with both backend and frontend services.

## Prerequisites
- Railway.com account (free tier available)
- GitHub account with your repository
- Domain name (optional, Railway provides free .railway.app subdomains)

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"Create New Project"**
3. Select **"Deploy from GitHub"**
4. Authenticate and select your Shaxe repository
5. Name your project: `shaxe`

## Step 2: Add PostgreSQL Database

1. In Railway dashboard, click **"+ New Service"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for PostgreSQL to initialize (1-2 minutes)
4. Go to PostgreSQL service settings
5. Copy the **DATABASE_URL** from the "Connect" tab
6. Save this for backend environment variables

## Step 3: Create Backend Service

1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select your repository again (if not auto-selected)
3. Wait for build to initialize
4. Click the **Backend Service** → **"Settings"** tab
5. Set **Root Directory** to `backend/`
6. Set **Dockerfile** to `backend/Dockerfile`
7. Set **Start Command** to `npm start` (or remove if using Dockerfile)

### Backend Environment Variables

Click **"Variables"** tab and add the following:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-change-this
JWT_EXPIRE=30d
KYC_PROVIDER=mock
UPLOAD_PROVIDER=local
API_URL=https://your-backend-railway-url.railway.app
FRONTEND_URL=https://your-frontend-railway-url.railway.app
CORS_ORIGIN=https://your-frontend-railway-url.railway.app
```

**Important:** 
- Replace `JWT_SECRET` with a strong random string (min 32 characters)
- Use actual Railway URLs once services are deployed (see "Get Service URLs" below)
- For production: Consider upgrading KYC_PROVIDER to "jumio" and UPLOAD_PROVIDER to "aws-s3"

## Step 4: Create Frontend Service

1. Click **"+ New Service"** → **"GitHub Repo"**
2. Select your repository
3. Click the **Frontend Service** → **"Settings"** tab
4. Set **Root Directory** to `frontend/`
5. Set **Dockerfile** to `frontend/Dockerfile`
6. Remove any **Build Command** if set (Dockerfile handles it)

### Frontend Environment Variables

Click **"Variables"** tab and add:

```env
REACT_APP_API_URL=https://your-backend-railway-url.railway.app
REACT_APP_ENV=production
REACT_APP_ENABLE_MOCK_KYC=true
REACT_APP_ENABLE_DEBUG=false
```

## Step 5: Get Service URLs

Once services are deployed:

1. Click **Backend Service** in dashboard
2. Under **Deployments**, find the URL (e.g., `shaxe-backend-prod.railway.app`)
3. Click **Frontend Service**
4. Under **Deployments**, find the URL (e.g., `shaxe-frontend-prod.railway.app`)
5. Update both services' environment variables with actual URLs:
   - Update Backend: `API_URL` and `FRONTEND_URL`
   - Update Frontend: `REACT_APP_API_URL`

Services will auto-redeploy when environment variables change.

## Step 6: Initialize Database

Once backend is deployed and running:

1. Connect to PostgreSQL service from Railway dashboard
2. Run migrations:
   ```bash
   cd backend
   npm run migrate
   ```
3. Or manually connect and run SQL files from `backend/migrations/`

## Step 7: Configure Custom Domain (Optional)

1. Go to **Frontend Service** → **Settings**
2. Scroll to **"Domains"** section
3. Click **"+ Add Domain"**
4. Enter your domain (e.g., `app.shaxe.com`)
5. Railway will provide DNS instructions
6. Update your domain registrar's DNS records with the CNAME
7. Wait for SSL certificate (automatic, ~5 minutes)

## Step 8: Set Up Auto-Deployment

1. Your repository is already connected
2. Auto-deployment is enabled by default
3. Each push to main/master branch triggers automatic redeploy
4. Monitor deployments in **Deployments** tab

## Testing Your Deployment

### Backend Health Check
```bash
curl https://your-backend-url.railway.app/health
```

### Test Authentication Flow
1. Visit frontend URL
2. Click **Sign Up**
3. Create account with test data
4. Complete KYC verification
5. Create a post to verify API integration
6. Test engagement features (like, comment, etc.)

### Verify Database Connection
1. Check backend logs in Railway dashboard
2. Look for: `"Database connected successfully"` message

## Troubleshooting

### Backend won't start
- Check **Logs** tab in backend service
- Verify DATABASE_URL is correct
- Ensure all required environment variables are set
- Check that Node.js version in Dockerfile matches package.json

### Frontend shows blank page
- Check browser console for API errors
- Verify REACT_APP_API_URL is correct in frontend env vars
- Check that backend is responding to requests

### Build failures
- Click on failed deployment in **Deployments** tab
- Read the build log for specific errors
- Common issues:
  - Missing dependencies: `npm install` didn't run
  - Port conflicts: Check PORT env var
  - File path issues: Verify Dockerfile paths

### Database connection errors
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check that PostgreSQL service is running (green status)
- Ensure backend has network access to database

## Monitoring & Logs

### View Logs
1. Click any service in dashboard
2. Go to **Logs** tab
3. Filter by date/search for errors
4. Real-time logs appear automatically

### Set Up Error Notifications (Optional)
1. Go to **Project Settings**
2. Enable **GitHub Notifications**
3. Receive alerts for deployment failures

## Performance Optimization

### After Initial Deployment:

1. **Enable Caching** (Frontend)
   - Add `Cache-Control` headers in nginx config
   - Railway frontend handles this automatically with `serve`

2. **Database Backups** (PostgreSQL)
   - Railway auto-backups daily
   - Access backups in PostgreSQL service settings

3. **Monitor Resource Usage**
   - Check CPU/Memory in service stats
   - Upgrade if needed (Railway scales automatically)

## Cost Optimization

Railway's pricing:
- **Free tier:** $5/month credits (generous for hobby projects)
- **Pay-as-you-go:** Only charge for what you use
- **Database:** PostgreSQL included, $10/month for production tier
- **Bandwidth:** First 100GB free, then $0.10/GB

**Estimated monthly cost:** $5-15 for hobby deployment

## Next Steps

1. ✅ Create Railway project
2. ✅ Deploy PostgreSQL database
3. ✅ Deploy backend service
4. ✅ Deploy frontend service
5. ⏳ Test all features end-to-end
6. ⏳ Set up custom domain (optional)
7. ⏳ Configure monitoring
8. ⏳ Plan backups

## Support

- [Railway Documentation](https://docs.railway.app)
- [GitHub Issues](https://github.com) - For app-specific issues
- [Railway Community Discord](https://discord.gg/railway)

---

**Deployment Status Checklist:**

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] PostgreSQL database added
- [ ] Backend service deployed (URL: _______________)
- [ ] Frontend service deployed (URL: _______________)
- [ ] Environment variables configured
- [ ] Database migrations ran successfully
- [ ] Auth flow tested (signup/login)
- [ ] Post creation tested
- [ ] Engagement features tested
- [ ] All endpoints responding (backend health check: ✅)
- [ ] Frontend connects to backend (no CORS errors)
- [ ] Custom domain configured (optional)
- [ ] Auto-deployment working (push to repo = auto-deploy)
