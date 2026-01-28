# 🚀 SHAXE APP SETUP - NEXT STEPS

**Current Status:** January 28, 2026  
**Project Phase:** Railway Deployment with Frontend & Backend Integration

---

## 📋 IMMEDIATE NEXT STEPS (Next 24 Hours)

### PHASE 1: Railway Backend Deployment ⏱️ 15-20 minutes

**Goal:** Get backend API running on Railway

#### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"Create New Project"** → **"Deploy from GitHub"**
3. Select `bjcharle/shaxe` repository
4. Name it: `shaxe`

#### Step 2: Add PostgreSQL Database ⏱️ 2-3 minutes
1. In dashboard: **+ New Service** → **Database** → **PostgreSQL**
2. Wait for initialization (green status)
3. Copy **DATABASE_URL** from **Connect** tab
4. Save to notepad/secure location

#### Step 3: Create Backend Service ⏱️ 5-10 minutes
1. **+ New Service** → **GitHub Repo**
2. Select `shaxe` repo
3. Go to **Settings** tab:
   - **Root Directory:** `backend/`
   - **Dockerfile:** `backend/Dockerfile`
4. Go to **Variables** tab, add:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[paste-your-postgres-url]
   JWT_SECRET=[generate-32-char-random-string]
   JWT_EXPIRE=30d
   KYC_PROVIDER=mock
   UPLOAD_PROVIDER=local
   API_URL=https://shaxe-backend.railway.app
   FRONTEND_URL=https://shaxe-frontend.railway.app
   CORS_ORIGIN=https://shaxe-frontend.railway.app
   ```
5. Wait for deployment (5-10 min)
6. Check **Logs** tab for success message

**Success Check:** Backend URL appears in **Deployments** tab

---

### PHASE 2: Railway Frontend Deployment ⏱️ 10-15 minutes

**Goal:** Get React app running on Railway

#### Step 4: Create Frontend Service
1. In Railway dashboard: **+ New Service** → **GitHub Repo**
2. Select `shaxe` repo again
3. Go to **Settings** tab:
   - **Root Directory:** `frontend/`
   - **Dockerfile:** `Dockerfile` (not `frontend/Dockerfile`)
   - **Builder:** Select "Dockerfile"
4. Go to **Variables** tab, add:
   ```env
   REACT_APP_API_URL=https://[backend-url].railway.app/api
   REACT_APP_ENV=production
   REACT_APP_ENABLE_MOCK_KYC=true
   REACT_APP_ENABLE_DEBUG=false
   ```
5. Wait for deployment (5-10 min)
6. Check **Logs** for build status

**Success Check:** Frontend URL appears in **Deployments** tab

---

### PHASE 3: Link Backend & Frontend ⏱️ 5 minutes

Once both are deployed:

1. **Get Backend URL:**
   - Backend Service → **Deployments** → Copy URL
   - Example: `shaxe-backend-prod.railway.app`

2. **Get Frontend URL:**
   - Frontend Service → **Deployments** → Copy URL
   - Example: `shaxe-frontend-prod.railway.app`

3. **Update Backend Variables:**
   - Backend Service → **Variables**
   - Set `API_URL=https://shaxe-backend-prod.railway.app`
   - Set `FRONTEND_URL=https://shaxe-frontend-prod.railway.app`
   - Set `CORS_ORIGIN=https://shaxe-frontend-prod.railway.app`

4. **Update Frontend Variables:**
   - Frontend Service → **Variables**
   - Set `REACT_APP_API_URL=https://shaxe-backend-prod.railway.app/api`

Services auto-redeploy on env var changes

---

### PHASE 4: Test Deployment ⏱️ 10 minutes

**Test Backend:**
```bash
curl https://[backend-url].railway.app/health
# Should return: { "status": "ok" }
```

**Test Frontend:**
1. Visit `https://[frontend-url].railway.app` in browser
2. Should see Shaxe login page with purple theme
3. Try signup flow:
   - Click **"Sign Up"**
   - Enter test credentials
   - Should redirect to KYC form

**Test API Integration:**
1. Login at frontend URL
2. Should be able to create posts
3. Check backend logs for API calls

---

## 🎯 MEDIUM-TERM SETUP (This Week)

### Day 2: Database Initialization
- [ ] Run backend migrations
- [ ] Initialize seed data (optional test users)
- [ ] Verify database tables created

**Commands:**
```bash
# SSH into backend container via Railway
cd backend
npm run migrate
```

### Day 3: Testing & Validation
- [ ] Test all auth endpoints
- [ ] Test post creation/feed
- [ ] Test engagement features
- [ ] Test user profiles

### Day 4: Custom Domain (Optional)
- [ ] Buy domain (or use free .railway.app)
- [ ] Configure DNS in Railway dashboard
- [ ] Set up SSL certificate (auto)

### Day 5: Monitoring & Optimization
- [ ] Set up error logging
- [ ] Configure auto-scaling
- [ ] Monitor CPU/memory usage
- [ ] Optimize database queries

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment ✅
- [x] Backend code ready
- [x] Frontend code ready
- [x] Dockerfiles configured
- [x] Environment variables documented
- [x] Repository pushed to GitHub

### Deployment Phase
- [ ] Create Railway project
- [ ] Add PostgreSQL
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Link services with URLs
- [ ] Verify health checks pass

### Post-Deployment
- [ ] Test auth flow (signup/login)
- [ ] Test post creation
- [ ] Test engagement buttons
- [ ] Check browser console for errors
- [ ] Review Railway logs for issues
- [ ] Document final URLs

---

## 🔑 IMPORTANT CREDENTIALS & URLS

**Keep This Safe** (Save somewhere secure):

```
Project Name: shaxe
Railway Org: [your-organization]
GitHub Repo: bjcharle/shaxe

PostgreSQL:
- DATABASE_URL: [from Railway Connect tab]

Backend Service:
- URL: https://shaxe-backend-prod.railway.app
- JWT_SECRET: [your-32-char-random-string]

Frontend Service:
- URL: https://shaxe-frontend-prod.railway.app

Custom Domain (if configured):
- shaxe.com → [add later]
```

---

## ⚡ TROUBLESHOOTING QUICK REFERENCE

### Backend Won't Deploy
- Check **Build Logs** in Deployments tab
- Verify `backend/Dockerfile` exists
- Ensure `Root Directory` is `backend/`
- Check `DATABASE_URL` environment variable is set

### Frontend Build Fails
- Check **Build Logs**
- Verify `frontend/Dockerfile` exists
- Set `Root Directory` to `frontend/`
- Set `Dockerfile` to `Dockerfile` (not `frontend/Dockerfile`)
- Ensure `REACT_APP_API_URL` is correct

### Frontend Shows Blank Page
- Open browser DevTools (F12)
- Check Console tab for errors
- Verify `REACT_APP_API_URL` matches backend URL
- Check Network tab for failed API calls

### CORS Errors
- Backend: Verify `CORS_ORIGIN` matches frontend URL exactly
- Frontend: Verify `REACT_APP_API_URL` is correct
- Both URLs should use `https://` not `http://`

### Database Connection Fails
- Verify `DATABASE_URL` format is correct
- Check PostgreSQL service is running (green status)
- Restart backend service if needed

---

## 📚 REFERENCE DOCUMENTATION

| Topic | File | Purpose |
|-------|------|---------|
| **Deployment Guide** | `RAILWAY_DEPLOYMENT.md` | Detailed Railway setup |
| **Backend API** | `FEATURE_IMPLEMENTATION_COMPLETE.md` | All endpoints |
| **Frontend Setup** | `FRONTEND_SETUP_GUIDE.md` | React component structure |
| **Architecture** | `ARCHITECTURE.md` | System design overview |
| **Quick Start** | `QUICKSTART.md` | 5-min quick reference |

---

## 🎓 IMPORTANT NOTES

### URL Format
- Always use full URLs with `https://`
- Example: `https://shaxe-backend-prod.railway.app/api`
- NOT: `shaxe-backend-prod` or `http://...`

### Environment Variables
- `REACT_APP_*` variables are embedded in frontend bundle
- Backend variables are secret (not exposed)
- Change any variable → service auto-redeploys

### Database Migrations
- Automatically run on first backend startup
- Located in `backend/migrations/`
- Can be run manually if needed

### Cost Estimation
- PostgreSQL: $0-10/month
- Backend: $0-5/month
- Frontend: $0-2/month
- **Total: ~$5-15/month** with Railway free credits

---

## ✅ COMPLETION CRITERIA

**Deployment is successful when:**

1. ✅ Backend service shows green status in Railway
2. ✅ Frontend service shows green status in Railway
3. ✅ Backend health check responds: `{ "status": "ok" }`
4. ✅ Frontend loads without blank page
5. ✅ Can signup/login with test account
6. ✅ No CORS errors in browser console
7. ✅ Can create posts and see them in feed
8. ✅ Database tables exist in PostgreSQL

---

## 🚀 READY TO START?

1. **Go to:** https://railway.app
2. **Login or Create Account**
3. **Follow PHASE 1-4 above**
4. **Time Estimate:** 45-60 minutes total

**Questions?** Reference `RAILWAY_DEPLOYMENT.md` or check Railway docs

Good luck! 🎉
