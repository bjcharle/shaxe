# Frontend Development Quick Reference

**Last Updated:** January 13, 2026  
**Status:** Phase 3 - Iteration 1 Complete  
**Frontend Progress:** 35%

---

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm start

# Runs on http://localhost:3000
```

---

## 📂 Component Directory

### Auth Components (`frontend/src/components/Auth/`)
- **Login.js** - Email/password login
- **Signup.js** - Register new account
- **KYCVerification.js** - Identity verification

### Post Components (`frontend/src/components/Posts/`)
- **PostFeed.js** - Display posts with pagination
- **CreatePost.js** - Create new post
- **PostCard.js** - Individual post display

### Engagement Components (`frontend/src/components/Engagement/`)
- **EngagementButtons.js** - Like, dislike, share, shame buttons
- **PointsDisplay.js** - Show balance and earning info

### Profile Components (`frontend/src/components/Profile/`)
- **UserProfile.js** - View user profile
- **ProfileEdit.js** - Edit own profile

### Report Components (`frontend/src/components/Reports/`)
- **ReportButton.js** - Report content
- **MyReports.js** - View submitted reports

### Common Components (`frontend/src/components/Common/`)
- **Navigation.js** - Top navigation bar
- **Loading.js** - Loading spinner

### State Management
- **AuthContext.js** (`frontend/src/context/`) - Auth state
- **useAuth.js** (`frontend/src/hooks/`) - Auth hook

---

## 🛣️ Available Routes

| Route | Component | Auth Required |
|-------|-----------|---------------|
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/kyc-verification` | KYCVerification | Yes |
| `/home` | Home | Yes |
| `/create` | CreatePost | Yes |
| `/trending` | Trending | Yes |
| `/profile/:id` | Profile | Yes |
| `/profile/edit` | ProfileEdit | Yes |
| `/reports` | MyReports | Yes |
| `/` | Redirect to /home | - |
| `/*` | NotFound | - |

---

## 🎨 Styling Files

| File | Purpose | Size |
|------|---------|------|
| `auth.css` | Login/Signup/KYC forms | 150+ LOC |
| `posts.css` | Feed, create, card styles | 150+ LOC |
| `engagement.css` | Buttons and points display | 120+ LOC |
| `profile.css` | Profile view and edit | 180+ LOC |
| `reports.css` | Report forms and list | 140+ LOC |
| `navigation.css` | Navbar styling | 110+ LOC |
| `common.css` | Loading, messages | 70+ LOC |
| `pages.css` | Page layouts | 120+ LOC |

---

## 🔌 API Integration

All components connected to backend via services in `frontend/src/services/`:

```javascript
// Import services
import { authService } from '../services';
import { postsService } from '../services';
import { engagementService } from '../services';
import { userService } from '../services';
import { pointsService } from '../services';
import { reportsService } from '../services';
import { trendingService } from '../services';

// Use in components
const user = await authService.signup(email, username, password, dob);
const posts = await postsService.getAllPosts(page);
const result = await engagementService.like(postId);
```

---

## 🔐 Authentication Flow

1. **Signup** (`/signup`) → Creates account
2. **KYC Verification** (`/kyc-verification`) → Verifies identity
3. **Login** (`/login`) → Authenticate with email/password
4. **Home** (`/home`) → Access full app

---

## 💾 State Management

**AuthContext** provides:
```javascript
const {
  user,              // Current user object
  token,             // JWT auth token
  loading,           // Initial load state
  error,             // Error message
  signup,            // Function to signup
  login,             // Function to login
  logout,            // Function to logout
  verifyKyc,         // Function to verify KYC
  isAuthenticated    // Boolean: user logged in?
} = useAuth();
```

---

## ✅ Component Checklist

### Core Functionality
- [x] Authentication (signup, login, KYC)
- [x] Post CRUD (create, read, delete)
- [x] Engagement (like, dislike, share, shame, shaxe, favorite)
- [x] Points tracking and display
- [x] User profiles (view, edit)
- [x] Content reporting
- [x] Navigation and routing

### Design & UX
- [x] Responsive design (mobile, tablet, desktop)
- [x] Error messages
- [x] Loading states
- [x] Success notifications
- [x] Form validation
- [x] Accessibility (labels, semantic HTML)

### Features
- [x] Token-based authentication
- [x] Verification status checks
- [x] Privacy controls
- [x] Pagination
- [x] Character limits
- [x] Image previews

---

## 🧪 Testing Checklist

Before shipping, test:
- [ ] Signup with validation
- [ ] Login flow
- [ ] KYC verification
- [ ] Create post
- [ ] Engagement buttons (all types)
- [ ] Profile view
- [ ] Profile edit
- [ ] Submit report
- [ ] View reports
- [ ] Logout
- [ ] Responsive on mobile

---

## 🛠️ Development Tips

### Adding a New Page
1. Create file in `frontend/src/pages/YourPage.js`
2. Import in `App.js`
3. Add route: `<Route path="/your-page" element={<YourPage />} />`
4. Add link in Navigation.js

### Adding a New Component
1. Create folder: `frontend/src/components/YourFolder/`
2. Create `YourComponent.js`
3. Create corresponding CSS: `frontend/src/styles/yourcomponent.css`
4. Import in parent component

### Using Auth in Components
```javascript
import { useAuth } from '../hooks/useAuth';

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) return <div>Please login</div>;
  
  return <div>Welcome, {user.username}!</div>;
}
```

### Making API Calls
```javascript
import { postsService } from '../services';

const [loading, setLoading] = useState(true);
const [posts, setPosts] = useState([]);
const [error, setError] = useState('');

useEffect(() => {
  postsService.getAllPosts(1)
    .then(data => setPosts(data))
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);
```

---

## 📊 Project Statistics

- **Components:** 20
- **Lines of Code:** 2,410
- **CSS Files:** 8
- **Routes:** 11
- **Services:** 7
- **Context Providers:** 1
- **Custom Hooks:** 1

---

## 📚 Related Documentation

- [FRONTEND_COMPONENTS_COMPLETE.md](FRONTEND_COMPONENTS_COMPLETE.md) - Detailed component guide
- [FRONTEND_SETUP_GUIDE.md](FRONTEND_SETUP_GUIDE.md) - Setup instructions
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) - Development plan
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Overall status

---

## ⏭️ What's Next?

**Iteration 2:**
- [ ] Admin moderation components
- [ ] Advanced components (PostDetail, PrivacySettings)
- [ ] Utility components (Modal, Toast, Dropdown)

**Iteration 3:**
- [ ] Additional context providers
- [ ] Custom hooks (useFetch, useForm, usePagination)
- [ ] Form state management

**Iteration 4:**
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Cypress)

**Deployment:**
- [ ] Docker setup
- [ ] CI/CD pipeline
- [ ] Staging environment
- [ ] Production deployment

---

## 📞 Quick Help

**Component not rendering?**
- Check import paths
- Verify component is exported
- Check console for errors

**API call failing?**
- Verify backend is running
- Check token in localStorage
- Look at network tab in DevTools

**Styling not applying?**
- Check CSS file is imported
- Verify class names match
- Check CSS specificity

**Route not working?**
- Verify route is added in App.js
- Check exact path syntax
- Ensure component is imported

---

## ✨ Current Features

✅ Complete authentication system  
✅ Full post management  
✅ Engagement tracking  
✅ User profiles with privacy  
✅ Content reporting  
✅ Points system  
✅ Responsive design  
✅ Error handling  
✅ Navigation  
✅ State management  

---

**Status: Ready for Testing & Next Iteration**
