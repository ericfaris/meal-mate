# Meal Mate - Project Overview

*Last Updated: 2026-01-27*

---

## 🎯 What is Meal Mate?

**Meal Mate** is a React Native mobile application for intelligent weekly meal planning with household collaboration. It helps users create, manage, and organize recipes while providing AI-powered meal suggestions based on preferences and constraints. Users can create households to share recipes and meal plans with family members.

### Core Features
- 🍽️ Recipe management with URL import
- 🤖 Smart weekly meal suggestions
- 📅 Flexible meal planning (past, present, future)
- 👥 **Household collaboration** - Share recipes and plans with family
- 🔐 Secure authentication (Email/Password + Google OAuth)
- 📱 Native mobile app (iOS/Android via Expo)
- 🔗 Deep linking for household invitations
- 🔔 **Push notifications** - Admin alerts for recipe submissions

---

## 🏗️ Architecture

```
React Native Frontend (Expo)
    ↓ REST API (Axios)
Backend (Node.js + Express + TypeScript)
    ↓ Mongoose ODM
MongoDB Atlas (Cloud Database)
```

### Design Patterns
- **User Isolation**: All queries scoped by userId for security
- **Service Layer**: API calls encapsulated in service modules
- **Authentication Context**: Global auth state management
- **Date Strings**: YYYY-MM-DD format to avoid timezone issues

---

## 📁 Project Structure

```
meal-mate/
├── version.json            # Single source of truth for app version
├── scripts/
│   └── bump-version.js    # Version bump automation script
├── frontend/               # React Native app
│   ├── app.config.js      # Expo config (reads version.json)
│   ├── eas.json           # EAS Build configuration
│   └── src/
│       ├── screens/       # Screen components
│       ├── navigation/    # React Navigation setup
│       ├── services/      # API clients
│       ├── contexts/      # Global state (Auth)
│       └── components/    # Reusable UI
│
├── backend/               # Node.js API
│   ├── Dockerfile         # Docker build with version labels
│   └── src/
│       ├── models/       # Mongoose schemas
│       ├── controllers/  # Request handlers
│       ├── routes/       # API endpoints
│       ├── services/     # Business logic
│       └── middleware/   # Auth, etc.
│
├── .github/workflows/
│   ├── docker-build.yml      # Backend Docker CI/CD
│   ├── eas-android-build.yml # Android EAS build pipeline
│   └── eas-ios-build.yml     # iOS EAS build pipeline
│
└── .claude/
    ├── CLAUDE.md         # This file
    └── rules/            # Modular documentation
        ├── frontend.md   # React Native patterns
        ├── backend.md    # Express/Node.js patterns
        ├── database.md   # MongoDB/Mongoose patterns
        └── api-design.md # API conventions
```

**Detailed documentation is organized into modular rules** - Claude Code will automatically load the relevant context when working on specific parts of the codebase.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native 0.81.5, Expo ~54.0.0, TypeScript |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Auth** | JWT, bcrypt, OAuth (Google) |
| **Mobile** | React Navigation, Expo Secure Store, Expo Notifications |

---

## 🗄️ Core Data Models

### User
- Email/password or OAuth (Google, Apple)
- JWT token-based authentication
- Household membership with role-based permissions (admin/member)
- Optional `pushToken` for Expo push notifications

### Household
- Named groups for shared cooking communities
- Member management with admin controls
- Invitation system with JWT tokens
- Shared access to recipes and meal plans

### Recipe
- User-owned recipes with ingredients, directions, images
- Tags, complexity (simple/medium/complex), dietary flags
- Tracks `lastUsedDate` for suggestion algorithm
- `planCount` computed via aggregation
- Household sharing (admins can view all household recipes)

### RecipeSubmission
- Member-submitted recipe URLs for admin approval
- Status tracking (pending/approved/denied)
- Admin review notes and feedback
- Automatic recipe import upon approval

### Plan
- One plan per user per date (unique index)
- Date stored as YYYY-MM-DD string (not Date object)
- Can reference a Recipe OR have a text label ("Eating Out")
- Confirmed plans update recipe's `lastUsedDate`
- Household plans visible to all members

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register        # Create account
POST   /api/auth/login           # Login
GET    /api/auth/me              # Get current user
POST   /api/auth/google          # Google OAuth
```

### Recipes
```
GET    /api/recipes              # List (search, tags)
POST   /api/recipes              # Create
PUT    /api/recipes/:id          # Update
DELETE /api/recipes/:id          # Delete
POST   /api/recipes/import       # Import from URL
```

### Plans
```
GET    /api/plans                # Get range (start, days)
PUT    /api/plans/:date          # Create/update
DELETE /api/plans/:date          # Delete
```

### Household Management
```
GET    /api/households           # Get current household details
POST   /api/households           # Create new household
POST   /api/households/join      # Join household via token
POST   /api/households/invite    # Generate invitation token
DELETE /api/households/leave     # Leave current household
```

### Recipe Submissions
```
GET    /api/submissions           # Get pending submissions (admin)
POST   /api/submissions           # Submit recipe URL for approval
PUT    /api/submissions/:id       # Review submission (approve/deny)
```

### Suggestions
```
POST   /api/suggestions/generate    # Week of suggestions
POST   /api/suggestions/alternative # Get alternative
POST   /api/suggestions/approve     # Save as plans
```

### User Management
```
PUT    /api/users/push-token        # Save push token for notifications
DELETE /api/users/push-token        # Remove push token (on logout)
```

See @.claude/rules/api-design.md for full API documentation.

---

## 🧠 Key Business Logic

### Household Permissions
**Location**: `backend/src/middleware/auth.ts`, `backend/src/controllers/household.ts`

Role-based access control:
- **Admin**: Can invite members, review submissions, view all household recipes/plans
- **Member**: Can submit recipe URLs, view approved recipes, create personal plans
- **User Isolation**: All queries scoped by `userId` OR household membership
- **Invitation System**: JWT tokens with 7-day expiry for secure invites

### Recipe Submission Workflow
**Location**: `backend/src/controllers/recipeSubmission.ts`

Member approval process:
1. Members submit recipe URLs via mobile app
2. Admins receive notifications of pending submissions
3. Admins can approve/deny with optional review notes
4. Approved recipes are automatically imported and become household-shared
5. Denied submissions include feedback for members

### Suggestion Algorithm
**Location**: `backend/src/services/suggestionService.ts`

Generates intelligent meal suggestions with constraints:
- Avoid repeats (10-day lookback window on `lastUsedDate`)
- Filter by vegetarian preference
- Prefer simple recipes (sort by complexity)
- Skip specific days (eating out, etc.)
- Shuffle for variety
- Household-aware: considers all household recipes for suggestions

### Recipe Import
**Location**: `backend/src/controllers/recipeImport.ts`

1. Try `recipe-scraper` library (primary)
2. Fall back to custom Cheerio parser
3. Auto-detect complexity:
   - Simple: ≤5 ingredients AND ≤20 min cook
   - Complex: >10 ingredients OR >60 min cook
   - Medium: everything else

---

## 🔢 Versioning

The project uses a **single source of truth** for versioning across all platforms.

### Version File (`version.json`)
```json
{
  "version": "1.0.0",
  "buildNumber": 1
}
```

### Version Flow

```
version.json (source of truth)
    ├── GitHub Actions → Docker Image Tags (v1.0.0, latest)
    │   └── Backend ENV: APP_VERSION, BUILD_NUMBER
    │       └── GET /api/version endpoint
    │
    └── app.config.js → Expo/EAS Build
        └── Android: version + versionCode
        └── iOS: version + buildNumber
        └── Settings Screen display
```

### Bumping Versions

```bash
# Bump patch version (1.0.0 → 1.0.1)
node scripts/bump-version.js patch

# Bump minor version (1.0.0 → 1.1.0)
node scripts/bump-version.js minor

# Bump major version (1.0.0 → 2.0.0)
node scripts/bump-version.js major

# Set specific version
node scripts/bump-version.js --set 2.0.0
```

### Version Visibility

| Platform | Where to Check |
|----------|----------------|
| **Backend API** | `GET /api/version` returns `{ version, buildNumber, environment }` |
| **Docker Image** | Tagged as `user/meal-mate-backend:1.0.0` |
| **Android App** | Settings screen shows "Version 1.0.0 (1)" |
| **Railway** | Pulls versioned Docker image |

### Release Workflow

1. Make changes and test locally
2. Run `node scripts/bump-version.js patch` (or minor/major)
3. Commit changes including updated `version.json`
4. Push to `main` branch
5. GitHub Actions automatically:
   - Builds Docker image with version tag
   - Pushes to Docker Hub with semantic version
   - Triggers EAS Android build (on frontend changes)
   - Triggers EAS iOS build (on frontend changes)
6. For manual mobile builds: Run `npx eas-cli build --platform android --profile production`

### CI/CD Pipelines

| Workflow                 | Trigger                    | Description                             |
|--------------------------|----------------------------|-----------------------------------------|
| `docker-build.yml`       | Push to main (backend/**)  | Builds and pushes backend Docker image  |
| `eas-android-build.yml`  | Push to main (frontend/**) | Triggers EAS Android APK build          |
| `eas-ios-build.yml`      | Push to main (frontend/**) | Triggers EAS iOS IPA build              |

**Required GitHub Secrets for EAS builds:**

- `EXPO_TOKEN` - Expo access token (from expo.dev account settings)
- `EXPO_USERNAME` - Expo account username

**Required for iOS App Store submission (optional):**

- `APPLE_ID` - Apple ID email for App Store Connect
- `ASC_APP_ID` - App Store Connect App ID
- `APPLE_TEAM_ID` - Apple Developer Team ID

---

## 🚀 Development

### Backend
```bash
cd backend
npm run dev          # Start with nodemon
npm run build        # TypeScript compilation
npm start            # Production
```

### Frontend
```bash
cd frontend
npm start            # Expo dev server
npm run android      # Android emulator
npm run ios          # iOS simulator
```

### Building for Production

#### EAS Build (Android/iOS)

```bash
cd frontend

# Login to Expo account (one-time)
npx eas-cli login

# Initialize EAS project (one-time)
npx eas-cli init --id 910a682b-5db4-440a-af99-ee987b813edf

# Build Android APK for sideloading
npx eas-cli build --platform android --profile preview

# Build for production (App Store/Play Store)
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production

# Check build status
npx eas-cli build:list --platform android --limit 5
```

**Build Profiles** (configured in [eas.json](eas.json)):

- `preview` - APK builds for sideloading (internal distribution)
- `production` - App Bundle/IPA for store submission
- `development` - Development builds with dev client

### Environment Variables

```bash
# backend/.env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
PORT=3000

# frontend/app.config.js
API_URL=http://localhost:3000
GOOGLE_WEB_CLIENT_ID=...
```

---

## 📚 Modular Documentation

Detailed implementation guides are organized by domain:

- **@.claude/rules/frontend.md** - React Native patterns, screens, navigation, state management
- **@.claude/rules/backend.md** - Express controllers, services, authentication, error handling
- **@.claude/rules/database.md** - MongoDB schemas, indexes, queries, performance
- **@.claude/rules/api-design.md** - API conventions, endpoints, request/response formats

Claude Code automatically loads these files when working on relevant code paths.

---

## 🔒 Security Principles

✅ **User Isolation**: Every query scoped by `userId`
✅ **Household Security**: Role-based access control (admin/member permissions)
✅ **JWT Authentication**: Tokens with 7-day expiry
✅ **Invitation Tokens**: Secure JWT-based household invites with expiration
✅ **Password Hashing**: bcrypt with 10 rounds
✅ **Input Validation**: All endpoints validate input
✅ **Secure Storage**: Expo Secure Store for tokens on device

---

## 📝 Code Conventions

### Naming
- Components: `PascalCase` (HomeScreen.tsx)
- Functions: `camelCase` (generateSuggestions)
- Constants: `UPPER_SNAKE_CASE` (API_BASE_URL)
- Database fields: `camelCase` (lastUsedDate)

### File Organization
- Frontend screens in `frontend/src/screens/`
- Backend controllers in `backend/src/controllers/`
- Shared types (consider monorepo structure)

---

## ⚠️ Critical Patterns

### Dates
**ALWAYS use YYYY-MM-DD strings for plan dates**
```typescript
// ✅ CORRECT
const plan = { date: '2026-01-11', recipeId }

// ❌ WRONG - timezone issues
const plan = { date: new Date(), recipeId }
```

### User Isolation
**ALWAYS scope queries by userId**
```typescript
// ✅ CORRECT
const recipe = await Recipe.findOne({ _id, userId: req.userId })

// ❌ WRONG - security vulnerability
const recipe = await Recipe.findById(_id)
```

### Data Fetching (Frontend)
**Use useFocusEffect for navigation-dependent loading**
```typescript
// ✅ CORRECT
useFocusEffect(useCallback(() => {
  loadData();
}, []));

// ❌ WRONG for navigation screens
useEffect(() => { loadData(); }, []);
```

### Household Permissions
**ALWAYS check user role for household operations**
```typescript
// ✅ CORRECT - Check admin role for sensitive operations
if (user.role !== 'admin') {
  return res.status(403).json({ message: 'Admin access required' });
}

// ✅ CORRECT - Scope queries by household membership
const recipes = await Recipe.find({
  $or: [
    { userId: req.userId },           // User's own recipes
    { householdId: user.householdId } // Household-shared recipes
  ]
});
```

### Android HTTP Cleartext Traffic
**Enable HTTP for local development builds**
```json
{
  "plugins": [
    ["expo-build-properties", {
      "android": { "usesCleartextTraffic": true }
    }]
  ]
}
```
**Why**: Android 9+ blocks HTTP by default. Required for APK builds connecting to local dev server.

---

## 🎯 Recent Development

Current branch: `main`

Recent changes:
- **🔢 Auto-Versioning System** - Unified versioning across all platforms
  - Single source of truth in `version.json`
  - Version bump script (`scripts/bump-version.js`)
  - GitHub Actions reads version and tags Docker images semantically
  - Frontend `app.config.js` reads version for Expo/EAS builds
  - Backend `/api/version` endpoint exposes version at runtime
  - Settings screen displays app version dynamically
- **🏠 Household Collaboration System** - Complete multi-user household functionality
  - Household creation, member invitations, and role-based permissions
  - Recipe submission workflow for member approval
  - Shared recipe and meal plan access within households
  - Deep linking support for invitation URLs
- **📱 Cross-Platform Modal Implementation** - Replaced iOS-only Alert.prompt with custom modals
  - Household creation, joining, and submission review modals
  - Full compatibility across Android, iOS, and web platforms
- **🔗 Deep Linking Integration** - Expo linking for household invitations
  - URL-based invitation tokens (exp://localhost:8081/join/{token})
  - Automatic token extraction from full URLs
- **👑 Role-Based UI** - Dynamic interface based on household permissions
  - Admin controls for member management and submissions
  - Member interface for recipe submissions and shared access
- **Google OAuth Migration** - Migrated from deprecated `expo-auth-session` to `@react-native-google-signin/google-signin`
- **Android OAuth Fix** - Resolved "invalid_request" error by using native Google Sign-In SDK
- **SHA-1 Configuration** - Properly configured Android OAuth client with SHA-1 certificate fingerprint
- **Logout Enhancement** - Added Google sign-out to logout flow
- **Android APK build configuration** - HTTP cleartext traffic enabled for local development
- **Enhanced error logging** - Detailed network error messages in auth service
- **🏡 Household Screen Redesign** - Moved household section from Settings to dedicated screen
  - Household management now accessible as peer to Settings screen
  - Improved navigation with dedicated Household tab in avatar menu
  - Reordered sections: Pending submissions now appear below Leave/Delete Household
  - Added proper padding and visual spacing throughout
- **🔔 Admin Notifications** - Home screen alerts for pending recipe approvals
  - Fun, eye-catching notification for household admins with pending submissions
  - One-tap navigation to Household screen for review
  - Dynamic text showing submission count with proper pluralization
  - Positioned prominently after greeting for high visibility
- **📲 Push Notifications** - Native Android/iOS push notifications via Expo
  - Admins receive push notifications when members submit recipes
  - Uses Expo Push Notifications service (works with EAS builds)
  - Notification channels for Android (Recipe Submissions)
  - Tap notification to navigate directly to Household screen
  - Push token management: saved on login, removed on logout
- Recipe creation refactor (ingredients/directions optional)
- Plan count tracking on recipes
- Clickable stat cards for navigation

---

## 📋 Future Roadmap

- [ ] AI-powered suggestions (Anthropic Claude API)
- [ ] Grocery list generation from meal plans
- [x] Push notifications for recipe submissions (completed)
- [ ] Push notifications for meal reminders
- [ ] Apple OAuth refinement and testing
- [ ] EAS Build for App Store submission
- [ ] Household analytics and insights
- [ ] Recipe sharing beyond households
- [ ] Meal plan templates and presets

---

## 💡 Quick Reference

### Common Operations

**Add a new API endpoint:**
1. Define route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add service method in `frontend/src/services/api/`
4. See @.claude/rules/api-design.md for conventions

**Add household functionality:**
1. Update models in `backend/src/models/` (User, Household, RecipeSubmission)
2. Add role checks in controllers and middleware
3. Create household-aware queries with `$or: [{userId}, {householdId}]`
4. Update frontend components with role-based UI
5. Add invitation token handling with deep linking

**Add a new screen:**
1. Create in `frontend/src/screens/`
2. Add to navigation in `frontend/src/navigation/`
3. Create service calls if needed
4. See @.claude/rules/frontend.md for patterns

**Add a database field:**
1. Update schema in `backend/src/models/`
2. Add index if queried frequently
3. Update TypeScript types
4. See @.claude/rules/database.md for best practices

---

## 📞 Getting Help

- `/help` - Claude Code help
- Report issues: https://github.com/anthropics/claude-code/issues
- Project issues: Create in this repository

---

**For implementation details, see the modular documentation in `.claude/rules/`**
