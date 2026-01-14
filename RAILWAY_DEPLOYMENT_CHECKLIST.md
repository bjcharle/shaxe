# Railway.com Deployment Checklist

## Pre-Deployment Phase

### Account Setup
- [ ] Create Railway.com account
- [ ] Verify email address
- [ ] Set up billing (optional, free tier has $5 credit)
- [ ] GitHub account connected to Railway

### Code Preparation
- [ ] All changes committed to Git
- [ ] Main/master branch is up to date
- [ ] No uncommitted changes in repository
- [ ] backend/Dockerfile exists and is valid
- [ ] frontend/Dockerfile exists and is valid
- [ ] railway.json exists in root directory
- [ ] .dockerignore files created for both services

### Environment Configuration
- [ ] .env.railway.backend file prepared with all variables
- [ ] frontend/.env.railway file prepared with all variables
- [ ] JWT_SECRET is 32+ characters (generate with: `openssl rand -base64 32`)
- [ ] No sensitive data in code repository
- [ ] No .env files committed to Git

### Documentation Review
- [ ] Read RAILWAY_DEPLOYMENT.md
- [ ] Read RAILWAY_QUICK_REFERENCE.md
- [ ] Understand environment variables needed
- [ ] Have URLs for frontend and backend noted

---

## Deployment Phase - Step by Step

### Step 1: Create Railway Project ⏱️ ~2 minutes
- [ ] Log in to railway.app
- [ ] Click "Create New Project"
- [ ] Select "Deploy from GitHub"
- [ ] Authenticate GitHub
- [ ] Select your Shaxe repository
- [ ] Name project: "shaxe"
- [ ] Click "Deploy"

### Step 2: Add PostgreSQL Database ⏱️ ~3 minutes
- [ ] Click "+ New Service"
- [ ] Select "Database" → "PostgreSQL"
- [ ] Wait for database initialization
- [ ] Click PostgreSQL service
- [ ] Go to "Connect" tab
- [ ] Copy DATABASE_URL (save for Step 4)
- [ ] Copy to: .env.railway.backend

### Step 3: Configure Backend Service ⏱️ ~5 minutes
- [ ] Click "+ New Service" → "GitHub Repo"
- [ ] Select repository
- [ ] Wait for service to initialize
- [ ] Go to "Settings" tab
- [ ] Set "Root Directory" = `backend/`
- [ ] Set "Dockerfile" = `backend/Dockerfile`
- [ ] Go to "Variables" tab
- [ ] Add each variable from .env.railway.backend:
  - [ ] NODE_ENV = production
  - [ ] PORT = 5000
  - [ ] DATABASE_URL = [from PostgreSQL]
  - [ ] JWT_SECRET = [32+ char random string]
  - [ ] JWT_EXPIRE = 30d
  - [ ] KYC_PROVIDER = mock
  - [ ] UPLOAD_PROVIDER = local
  - [ ] API_URL = (update later after deployment)
  - [ ] FRONTEND_URL = (update later after deployment)
  - [ ] CORS_ORIGIN = (update later after deployment)
- [ ] Wait for build to complete (green checkmark)
- [ ] Check "Deployments" tab - should show green "SUCCESS"

### Step 4: Get Backend Service URL ⏱️ ~1 minute
- [ ] Click Backend service in dashboard
- [ ] Find "Deployments" section
- [ ] Copy the URL (e.g., `shaxe-backend-prod.railway.app`)
- [ ] Save as: BACKEND_URL

### Step 5: Configure Frontend Service ⏱️ ~5 minutes
- [ ] Click "+ New Service" → "GitHub Repo"
- [ ] Select repository
- [ ] Wait for service to initialize
- [ ] Go to "Settings" tab
- [ ] Set "Root Directory" = `frontend/`
- [ ] Set "Dockerfile" = `frontend/Dockerfile`
- [ ] Go to "Variables" tab
- [ ] Add variables from frontend/.env.railway:
  - [ ] REACT_APP_API_URL = https://[BACKEND_URL]
  - [ ] REACT_APP_ENV = production
  - [ ] REACT_APP_ENABLE_MOCK_KYC = true
  - [ ] REACT_APP_ENABLE_DEBUG = false
- [ ] Wait for build to complete
- [ ] Check "Deployments" tab - should show green "SUCCESS"

### Step 6: Get Frontend Service URL ⏱️ ~1 minute
- [ ] Click Frontend service in dashboard
- [ ] Find "Deployments" section
- [ ] Copy the URL (e.g., `shaxe-frontend-prod.railway.app`)
- [ ] Save as: FRONTEND_URL

### Step 7: Update Environment Variables ⏱️ ~3 minutes
**Update Backend Service:**
- [ ] Go to Backend service → Variables
- [ ] Edit `API_URL` = https://[BACKEND_URL]
- [ ] Edit `FRONTEND_URL` = https://[FRONTEND_URL]
- [ ] Edit `CORS_ORIGIN` = https://[FRONTEND_URL]
- [ ] Backend auto-redeploys (wait for green checkmark)

**Update Frontend Service:**
- [ ] Go to Frontend service → Variables
- [ ] Edit `REACT_APP_API_URL` = https://[BACKEND_URL]
- [ ] Frontend auto-redeploys (wait for green checkmark)

### Step 8: Initialize Database ⏱️ ~2 minutes
- [ ] Connect to PostgreSQL service
- [ ] Run migrations (from terminal in your local environment):
  ```bash
  cd backend
  npm run migrate
  ```
- [ ] Or manually copy SQL files from `backend/migrations/` and execute

---

## Post-Deployment Testing Phase ⏱️ ~15 minutes

### Health Checks
- [ ] Backend health endpoint responds:
  ```
  curl https://[BACKEND_URL]/health
  ```
  Expected: `{"status":"ok"}`

- [ ] Frontend loads without errors:
  ```
  Visit: https://[FRONTEND_URL]
  Expected: Login/Signup page displays
  ```

### Authentication Flow
- [ ] Click "Sign Up" on frontend
- [ ] Fill in test account:
  ```
  Email: test@example.com
  Password: TestPassword123!
  DOB: 1990-01-01
  ```
- [ ] Submit signup form
- [ ] See KYC verification page
- [ ] Upload test document (any image)
- [ ] Complete KYC
- [ ] Logout
- [ ] Login with test credentials
- [ ] Redirected to home page ✅

### Feature Testing
- [ ] **Post Creation**: Create post with text and hashtags
- [ ] **Post Feed**: See posts displayed with correct formatting
- [ ] **Engagement**: Like a post (button changes color)
- [ ] **Comments**: Add comment to post
- [ ] **Profile View**: Click on user profile, see stats
- [ ] **Profile Edit**: Edit profile information, picture
- [ ] **Points Display**: See points in sidebar
- [ ] **Trending**: Navigate to trending posts page
- [ ] **Reports**: Report a post, see report form
- [ ] **Navigation**: All navigation links work

### API Integration
- [ ] Check browser DevTools → Network tab
- [ ] All API requests return 200/201 status
- [ ] No CORS errors in console
- [ ] No 404 errors for backend endpoints
- [ ] No timeout errors

### Logs Review
- [ ] Backend service → Logs → no error messages
- [ ] Frontend service → Logs → build completed successfully
- [ ] PostgreSQL service → Logs → connections established
- [ ] Database query logs show migrations ran

---

## Production Hardening (Optional but Recommended)

### Security
- [ ] Rotate JWT_SECRET to new value (>32 chars)
- [ ] Set REACT_APP_ENABLE_DEBUG = false
- [ ] Set REACT_APP_ENABLE_MOCK_KYC = false (if using real KYC)
- [ ] Enable HTTP/HTTPS only (Railway does this by default)
- [ ] Set strong database password (Railway auto-generates)

### Performance
- [ ] Monitor CPU/Memory usage in Metrics tab
- [ ] Set up error notifications (GitHub integration)
- [ ] Configure database backup schedule
- [ ] Enable auto-deploy on push (default: enabled)

### Monitoring
- [ ] Set up log alerts for errors
- [ ] Configure uptime monitoring (optional: use UptimeRobot)
- [ ] Test monitoring by triggering a small error
- [ ] Verify notification channels work

---

## Custom Domain Setup (Optional) ⏱️ ~15 minutes

### Register Domain
- [ ] Purchase domain from registrar (GoDaddy, Namecheap, etc.)
- [ ] Domain is active and accessible

### Configure Frontend Domain
- [ ] Frontend service → Settings → "Domains"
- [ ] Click "+ Add Domain"
- [ ] Enter domain (e.g., `app.example.com`)
- [ ] Railway displays CNAME target
- [ ] Go to domain registrar
- [ ] Add CNAME record:
  ```
  Name: app
  Type: CNAME
  Value: [Railway CNAME from step above]
  ```
- [ ] Wait 24-48 hours for DNS propagation
- [ ] Test: `nslookup app.example.com`
- [ ] Railway auto-generates SSL certificate (5-10 min)

### Configure Backend Domain (Optional)
- [ ] Repeat above steps for backend
- [ ] Example: `api.example.com`
- [ ] Update CORS_ORIGIN in backend env vars
- [ ] Update REACT_APP_API_URL in frontend env vars

---

## Rollback Plan (If Something Goes Wrong)

### Rollback to Previous Deployment
- [ ] Service → Deployments tab
- [ ] Find last known good deployment
- [ ] Click deployment → "Redeploy"
- [ ] Service automatically redeploys that version
- [ ] Check health endpoints after rollback

### Rollback to Previous Code
- [ ] Git revert to previous commit:
  ```bash
  git revert HEAD
  git push
  ```
- [ ] Railway auto-detects changes and redeploys
- [ ] Wait for green checkmark on deployment

### Troubleshooting
- [ ] Check logs for specific error
- [ ] Verify environment variables are correct
- [ ] Ensure database connection is working
- [ ] Test health endpoints
- [ ] Check browser console for frontend errors

---

## Post-Launch Monitoring

### Daily Checks (First Week)
- [ ] Check logs for errors: Daily 9 AM
- [ ] Verify uptime: Visit frontend daily
- [ ] Monitor database: Check PostgreSQL health
- [ ] Test authentication: Login daily
- [ ] Monitor resources: CPU/Memory <80%

### Weekly Checks
- [ ] Review error logs
- [ ] Check for failed deployments
- [ ] Verify database backups
- [ ] Test all features end-to-end
- [ ] Review performance metrics

### Monthly Tasks
- [ ] Rotate JWT_SECRET
- [ ] Review and update dependencies
- [ ] Optimize database queries if needed
- [ ] Review error trends
- [ ] Plan upgrades if needed

---

## Documentation & Handoff

- [ ] Save backend URL: `_____________________`
- [ ] Save frontend URL: `____________________`
- [ ] Save database URL: `____________________`
- [ ] Save JWT_SECRET: `_____________________`
- [ ] Create team access (invite other developers)
- [ ] Share RAILWAY_DEPLOYMENT.md with team
- [ ] Share RAILWAY_QUICK_REFERENCE.md with team
- [ ] Document any custom configurations
- [ ] Set up on-call schedule for alerts

---

## Deployment Summary

**Deployment Status:** 
- [ ] All services deployed and green ✅
- [ ] All tests passing ✅
- [ ] Database initialized ✅
- [ ] Environment variables configured ✅
- [ ] Health checks responding ✅
- [ ] Authentication flow working ✅
- [ ] Full feature suite tested ✅
- [ ] Monitoring active ✅

**Launch Time:** `_____________________`

**Deployed By:** `_____________________`

**Notes:** 

```
[Any special notes or issues encountered]




```

---

**Ready for Production! 🚀**

Your Shaxe application is now live on Railway.com
