# Railway.com Deployment - Quick Reference

## 🚀 30-Second Summary
Deploy your Shaxe app in 5 steps:
1. Create Railway account
2. Connect GitHub repo
3. Add PostgreSQL database
4. Deploy backend (with Dockerfile)
5. Deploy frontend (with Dockerfile)

---

## 📋 Pre-Deployment Checklist

- [ ] Railway.com account created and logged in
- [ ] GitHub repository committed and pushed
- [ ] `backend/Dockerfile` exists
- [ ] `frontend/Dockerfile` exists
- [ ] `.env.railway.backend` file prepared
- [ ] `frontend/.env.railway` file prepared
- [ ] `railway.json` exists in root directory
- [ ] Backend has `package.json` with start script
- [ ] Frontend has `package.json` with build script

---

## 🔗 Environment Variables Reference

### Backend (.env.railway.backend)

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `NODE_ENV` | production | ✅ | Must be "production" for Railway |
| `PORT` | 5000 | ✅ | Port to expose |
| `DATABASE_URL` | postgresql://... | ✅ | From PostgreSQL service |
| `JWT_SECRET` | [64-char string] | ✅ | Generate strong secret |
| `JWT_EXPIRE` | 30d | ✅ | Token expiration |
| `API_URL` | https://backend.railway.app | ✅ | Backend public URL |
| `FRONTEND_URL` | https://frontend.railway.app | ✅ | Frontend public URL |
| `CORS_ORIGIN` | https://frontend.railway.app | ✅ | CORS allowed origin |
| `KYC_PROVIDER` | mock | ✅ | "mock" or "jumio" |
| `UPLOAD_PROVIDER` | local | ✅ | "local" or "aws-s3" |

### Frontend (.env.railway)

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `REACT_APP_API_URL` | https://backend.railway.app | ✅ | Backend URL from Railway |
| `REACT_APP_ENV` | production | ✅ | Environment flag |
| `REACT_APP_ENABLE_MOCK_KYC` | true | ❌ | Set false in production |
| `REACT_APP_ENABLE_DEBUG` | false | ❌ | Keep false in production |

---

## 📊 Service Configuration

### Backend Service
```
Root Directory:    backend/
Dockerfile:        backend/Dockerfile
Start Command:     (leave empty - Dockerfile handles it)
Port:              5000
Health Check:      GET /health (optional)
```

### Frontend Service
```
Root Directory:    frontend/
Dockerfile:        frontend/Dockerfile
Build Command:     (leave empty - Dockerfile handles it)
Start Command:     (leave empty - Dockerfile handles it)
Port:              3000
```

### PostgreSQL Database
```
Automatic backup:  Daily
Connection limit:  100 (upgrade if needed)
Storage:           Default 1GB (Railway auto-scales)
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is 32+ characters, random, and strong
- [ ] CORS_ORIGIN matches frontend URL exactly
- [ ] DATABASE_URL uses strong password (Railway generates this)
- [ ] No hardcoded secrets in code or git history
- [ ] HTTPS is enforced (Railway auto-enables for *.railway.app)
- [ ] Environment variables are not logged
- [ ] API keys rotated periodically
- [ ] Database backups enabled (Railway auto-does this)

---

## 🧪 Post-Deployment Testing

### 1. Backend Health Check
```bash
curl https://backend-url.railway.app/health
```
Expected response: `{"status":"ok"}`

### 2. Frontend Load
```
Visit: https://frontend-url.railway.app
Should see: Login/Signup page (no blank screen)
```

### 3. Full Auth Flow
1. Visit frontend URL
2. Sign up with email/password
3. Complete KYC verification
4. Login with credentials
5. Should redirect to Home page

### 4. API Integration
1. On home page, create a post
2. Like/comment on a post (if exists)
3. View your profile
4. Edit profile information
5. Check all features work without API errors

### 5. View Logs
```
Backend logs:  Backend Service → Logs → search "error"
Frontend logs: Browser DevTools → Console tab
Database:      PostgreSQL Service → Logs
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails | Missing dependencies | Ensure `npm install` runs in Dockerfile |
| Port mismatch | Wrong PORT env var | Set NODE_ENV=production, PORT=5000 |
| Database error | Wrong DATABASE_URL | Copy exactly from PostgreSQL service |
| CORS error | Frontend URL mismatch | Update CORS_ORIGIN to match frontend URL |
| Blank page | API not responding | Check backend URL in REACT_APP_API_URL |
| 503 error | Service not running | Check logs, verify Dockerfile syntax |
| Timeout | Build taking too long | Check for large dependencies, use npm ci |

---

## 📈 Deployment Monitoring

### View Real-Time Logs
1. Click service → **Logs** tab
2. Filter by keyword: `error`, `warn`, `success`
3. View line-by-line execution

### Check Service Status
1. Dashboard shows green ✅ = healthy
2. Yellow 🟡 = deploying
3. Red 🔴 = error/failed

### Monitor Resources
1. Click service → **Metrics** tab
2. View CPU, Memory, Network usage
3. Upgrade if consistently >80% usage

---

## 🔄 Continuous Deployment

**Auto-deployment enabled by default**

- ✅ Push to main/master branch
- ✅ Railway detects changes
- ✅ Automatic rebuild and deploy
- ✅ Zero-downtime deployment
- ✅ Rollback to previous deployment (manual, if needed)

**Disable auto-deploy:**
- Service Settings → Deployments → Toggle "Auto Deploy"

---

## 💾 Database Backups

Railway automatically backs up PostgreSQL daily.

**To restore from backup:**
1. PostgreSQL Service → Backups tab
2. Select backup date
3. Click "Restore" (creates new instance)
4. Update DATABASE_URL if needed

---

## 🌐 Custom Domain Setup

1. **Domain registrar** (GoDaddy, Namecheap, etc.)
2. Frontend Service → Settings → Domains → Add Domain
3. Railway gives you CNAME target
4. Add CNAME record to your domain registrar:
   ```
   CNAME: frontend.yourdomain.com → cname.railway.app
   ```
5. Wait for DNS propagation (24-48 hours)
6. Railway auto-generates HTTPS certificate

---

## 💰 Cost Estimate

| Service | Free Tier | Cost |
|---------|-----------|------|
| Backend (Node.js) | $5/month credit | $0-5 |
| Frontend (React) | Included in credit | $0 |
| PostgreSQL | Included in credit | $10/month |
| Bandwidth | 100GB free | $0.10/GB after |
| **Total** | **$5/month credit** | **$10-15/month** |

*More than enough for hobby/small production projects*

---

## 📞 Support Resources

- **Docs:** https://docs.railway.app
- **Community:** https://discord.gg/railway
- **Status:** https://status.railway.app
- **Contact:** support@railway.app

---

## 🎯 Next Steps

1. ✅ Create Railway account (2 min)
2. ✅ Connect GitHub (2 min)
3. ✅ Add PostgreSQL (2 min)
4. ✅ Deploy backend (3 min)
5. ✅ Deploy frontend (3 min)
6. ✅ Configure environment variables (5 min)
7. ✅ Test all features (10 min)
8. ✅ Set up custom domain (optional)
9. ✅ Enable monitoring (optional)

**Total: ~30 minutes from start to live!**

---

**Last Updated:** During Phase 3 Implementation
**Status:** Ready for Deployment ✅
