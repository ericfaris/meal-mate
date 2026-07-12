# Meal Mate - Project Overview

*Last Updated: 2026-02-04*

---

## 🎯 What is Meal Mate?

**Meal Mate** is a React Native mobile application for intelligent weekly meal planning with household collaboration. It helps users create, manage, and organize recipes while providing AI-powered meal suggestions based on preferences and constraints. Users can create households to share recipes and meal plans with family members.

### Core Features
- 🍽️ Recipe management with URL import and photo import (AI-powered)
- 🤖 Smart weekly meal suggestions (optional AI enhancement)
- 📅 Flexible meal planning (past, present, future) with Leftovers option
- 👥 **Household collaboration** - Share recipes and plans with family
- 🔐 Secure authentication (Email/Password + Google OAuth)
- 📱 Native mobile app (iOS/Android via Expo)
- 🔗 Deep linking for household invitations
- 🔔 **Push notifications** - Admin alerts for recipe submissions
- 🛒 **Grocery Lists** - AI-powered shopping lists with store layouts

---

## 🏗️ Architecture

```
React Native Frontend (Expo, Metro web bundler)
    → installable PWA at https://mealmate.mooseflip.com
    ↓ REST API (Axios) → https://mealmate-api.mooseflip.com
Backend (Node.js + Express + TypeScript)
    ↓ Mongoose ODM
MongoDB Atlas (Cloud Database)
```

**Deployment**: self-hosted Docker lab (root `docker-compose.yml`, two
containers — `web` on host 8600, `api` on host 8601) exposed publicly through
the shared Cloudflare Tunnel. Secrets come from an uncommitted root `.env`.
Deploy with `./scripts/lab-deploy.sh`. (Railway is retired — kept only as a
rollback path until Eric tears it down.)

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
├── frontend/               # React Native app (ships as web PWA)
│   ├── app.config.js      # Expo config (reads version.json)
│   ├── Dockerfile.web     # Web PWA build (expo export -> nginx)
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
│   └── (Docker Hub + EAS workflows removed — deploy is local via docker compose)
│
├── docker-compose.yml     # Lab stack: api + web (see scripts/lab-deploy.sh)
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
- **All new users default to 'admin' role** (no household membership initially)
- Household membership with role-based permissions (admin/member)

### Household
- Named groups for shared cooking communities
- Member management with admin controls
- Invitation system with JWT tokens
- Shared access to recipes and meal plans

### Recipe
- User-owned recipes with ingredients, directions, images
- Import via URL or photo (Claude Vision API for photo extraction)
- Tags, complexity (simple/medium/complex), dietary flags
- Tracks `lastUsedDate` for suggestion algorithm
- `planCount` computed via aggregation
- Household sharing (admins own recipes, members can edit them)

### RecipeSubmission
- Member-submitted recipe URLs for admin approval
- Status tracking (pending/approved/denied)
- Admin review notes and feedback
- Automatic recipe import upon approval

### Plan
- One plan per user per date (unique index)
- Date stored as YYYY-MM-DD string (not Date object)
- Can reference a Recipe OR have a text label ("Eating Out", "Leftovers", custom)
- Confirmed plans update recipe's `lastUsedDate`
- Household plans visible to all members

### GroceryList
- **Household-shared** grocery lists generated from meal plans
- Optional `householdId` field enables shared access within households
- `createdBy` tracks who created the list (for permission checks)
- Items track `addedBy` and `addedAt` for member activity
- Embedded items array with name, quantity, category, recipe sources
- Categories: Produce, Meat & Seafood, Dairy & Eggs, Pantry, Frozen, Bakery, Household, Other
- AI-powered ingredient parsing with regex fallback
- Status: active/archived
- **Permissions**: Only admins can create/delete lists; members can view and add items

### Store
- User-owned store layout configurations for grocery shopping
- Fields: name, categoryOrder (ordered array of 8 categories), isDefault
- Unique compound index on userId + name
- Auto-seeds 6 default stores (Aldi, Meijer, Kroger, Walmart, Whole Foods, Trader Joe's) on first access
- Store Mode reorders categories to match selected store's physical layout

### Staple
- **Household-shared** "My Staples" list of frequently purchased items
- Auto-saved when users add custom items to grocery lists (passive history)
- Fields: name, quantity, category, usageCount, lastUsedAt, `householdId`, `addedBy`
- Optional `householdId` field enables shared access within households
- `addedBy` tracks who added the staple
- Unique compound index on userId + name (case-insensitive upsert)
- Bulk-add staples to any grocery list in one tap
- **Permissions**: All users can add and delete staples

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
GET    /api/recipes                  # List (search, tags)
POST   /api/recipes                  # Create
PUT    /api/recipes/:id              # Update (admin-owned, member-editable)
DELETE /api/recipes/:id              # Delete (admin-only)
POST   /api/recipes/import           # Import from URL
POST   /api/recipes/import-photo     # Import from photo (Claude Vision, admin-only)
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

### Grocery Lists
```
POST   /api/grocery-lists              # Create from plans
GET    /api/grocery-lists              # List all (?status=)
GET    /api/grocery-lists/:id          # Get single list
PUT    /api/grocery-lists/:id          # Update name/status
PUT    /api/grocery-lists/:id/items/:index  # Check/edit item
POST   /api/grocery-lists/:id/items    # Add custom item (auto-saves to staples)
POST   /api/grocery-lists/:id/staples  # Bulk-add staples to list
DELETE /api/grocery-lists/:id/items/:index  # Remove item
DELETE /api/grocery-lists/:id          # Delete list
```

### Staples
```
GET    /api/staples                 # Get user's staples (sorted by usageCount)
POST   /api/staples                 # Create/update staple (upsert by name)
DELETE /api/staples/:id             # Delete single staple
DELETE /api/staples                 # Clear all staples
```

### Stores
```
GET    /api/stores                   # Get user's stores (seeds defaults if empty)
POST   /api/stores                   # Create a new store
PUT    /api/stores/:id               # Update (name, categoryOrder, isDefault)
DELETE /api/stores/:id               # Delete a store
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
**Location**: `backend/src/controllers/recipeImport.ts`, `backend/src/controllers/recipePhotoImport.ts`

**URL Import**:
1. Try `recipe-scraper` library (primary)
2. Fall back to custom Cheerio parser
3. HTML entity decoding for special characters
4. No auto-complexity detection (user sets manually)

**Photo Import** (Admin-only):
1. Uses Claude Vision API (claude-sonnet-4-20250514)
2. Accepts uploaded image (JPEG, PNG, GIF, WebP)
3. Extracts: title, ingredients, directions, prep/cook time, servings, tags
4. Returns JSON structure for manual review before saving
5. Requires ANTHROPIC_API_KEY environment variable
6. Admin-only feature to prevent API quota abuse

---

## 🔢 Versioning

The project uses a **single source of truth** for versioning across all platforms.

### Version File (`version.json`)
```json
{
  "version": "0.12.5",
  "buildNumber": 148
}
```

### Version Flow

```
version.json (source of truth)
    ├── scripts/lab-deploy.sh → docker compose build args (APP_VERSION, BUILD_NUMBER)
    │   └── Local Docker images (ericfaris/meal-mate-{backend,web}:latest, version labels)
    │       └── Backend ENV: APP_VERSION, BUILD_NUMBER
    │           └── GET /api/version endpoint (https://mealmate-api.mooseflip.com)
    │
    └── app.config.js → web PWA build (Dockerfile.web)
        └── Settings Screen display
```

### Bumping Versions

```bash
# Bump patch version (0.12.5 → 0.12.6)
node scripts/bump-version.js patch

# Bump minor version (0.12.5 → 0.13.0)
node scripts/bump-version.js minor

# Bump major version (0.12.5 → 1.0.0)
node scripts/bump-version.js major

# Set specific version
node scripts/bump-version.js --set 1.0.0
```

### Version Visibility

| Platform | Where to Check |
|----------|----------------|
| **Backend API** | `GET /api/version` at `https://mealmate-api.mooseflip.com/api/version` returns `{ version, buildNumber, environment }` |
| **Docker Image** | Built locally by `docker-compose.yml` as `ericfaris/meal-mate-{backend,web}:latest` with OCI version labels |
| **Web PWA** | Settings screen shows "Version 0.13.20 (170)" at `https://mealmate.mooseflip.com` |
| **Lab (self-hosted)** | Runs the images built by the last `./scripts/lab-deploy.sh` on this box, behind the shared Cloudflare Tunnel |

### Release Workflow

1. Make changes and test locally
2. Run `node scripts/bump-version.js patch` (or minor/major)
3. Commit changes including updated `version.json`
4. Push to `main` branch
5. Deploy on the self-hosted Docker lab (this machine): pull/checkout the commit, then run `./scripts/lab-deploy.sh` (which stamps `APP_VERSION`/`BUILD_NUMBER` from `version.json` and runs `docker compose up -d --build`). Secrets come from the uncommitted root `.env` (see `.env.example`).
6. Verify the deploy with `GET https://mealmate-api.mooseflip.com/api/version` (should report the new version and `environment: production`). The public web PWA is at `https://mealmate.mooseflip.com`, both exposed via the shared Cloudflare Tunnel.

The app ships solely as the web PWA. The native (EAS Android/iOS) build path and its GitHub Actions workflows were removed in the PWA migration.

### CI/CD Pipelines

Deployment is no longer driven by GitHub Actions. The backend and web images are
built locally on the Docker lab via `./scripts/lab-deploy.sh` (`docker compose up
-d --build`). The former `docker-build.yml` / `web-build.yml` (Docker Hub push)
and `eas-android-build.yml` / `eas-ios-build.yml` (native EAS build) workflows
have all been removed.

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

The app ships as an installable **web PWA**, built by `frontend/Dockerfile.web`
(`npx expo export --platform web` → nginx) and served from the self-hosted
Docker lab via the root `docker-compose.yml`. There is no native (Android/iOS)
build path anymore — it was removed in the PWA migration.

```bash
# From the repo root, build + (re)start the lab stack (stamps version.json):
./scripts/lab-deploy.sh          # docker compose up -d --build

# The web build bakes EXPO_PUBLIC_API_URL=https://mealmate-api.mooseflip.com
# (a build arg in docker-compose.yml, not a secret). src/config/api.ts also
# hard-falls-back to that production API URL in release builds as a safety net.
```

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

### Alerts and Modals (Frontend)
**NEVER use React Native's native Alert.alert() - use custom alertManager instead**
```typescript
// ❌ WRONG - Native Android alerts have terrible UX
Alert.alert('Error', 'Something went wrong');

// ✅ CORRECT - Custom modal system
alertManager.showError({ title: 'Error', message: 'Something went wrong' });
alertManager.showSuccess({ title: 'Success', message: 'Recipe saved!' });
alertManager.showConfirm({
  title: 'Delete',
  message: 'Are you sure?',
  confirmStyle: 'destructive',
  onConfirm: handleDelete,
});
alertManager.showInfo({ title: 'Info', message: 'No plans found', icon: 'calendar-outline' });
alertManager.showActionSheet({ options: [...] });
```
**Why**: Native Android alerts provide poor UX. Custom modals are animated, consistent, and cross-platform.
**Location**: `frontend/src/utils/alertUtils.ts` + modal components in `frontend/src/components/`

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

Current branch: `grocery-list-multiplayer`

Recent changes:
- **🎨 Custom Alert System** - Replaced all native Alert.alert with custom React Native modals
  - New modal components: ConfirmModal, InfoModal, ActionSheetModal
  - Centralized `alertManager` API for consistent alert handling
  - Animated modals with icons for better UX across all platforms
  - Never use native Android alerts again (documented in Critical Patterns)
- **🛒 Household Grocery Lists** - Shared grocery lists within households
  - Only admins can create/delete grocery lists; members can view and add items
  - Items track who added them (`addedBy`, `addedAt` fields)
  - Push notifications sent to admins when members add items
  - Deep linking to specific grocery list from notification tap
  - `householdId` field on GroceryList enables shared access
  - Role-based UI hides create button for members
  - New `requireAdminIfInHousehold` middleware for flexible permission checks
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
- **📸 Recipe Photo Import** - AI-powered recipe extraction from photos
  - Upload photo of recipe card, cookbook page, or screenshot
  - Claude Vision API extracts all recipe details automatically
  - Admin-only feature (requires ANTHROPIC_API_KEY)
  - Four import methods: URL, Browse Web, Photo, Manual (tabs in RecipeEntryScreen)
- **✏️ Member Recipe Editing** - Household members can update admin recipes
  - Members can edit existing recipes (title, ingredients, directions, etc.)
  - Only admins can delete recipes
  - Household-shared recipe pool maintained by admin, editable by all
- **🍴 Leftovers Plan Option** - Quick planning for leftover meals
  - "Leftovers" appears alongside "Eating Out" as a label option
  - No recipe required, just mark the day as using leftovers
  - Helps track non-recipe meals in weekly planning
- **🖼️ Image Caching** - Migrated from React Native Image to expo-image
  - Automatic image caching for faster load times
  - Reduced data usage on repeated recipe views
  - Better performance and memory management
- **📲 Push Notifications** - Native Android/iOS push notifications via Expo
  - Admins receive push notifications when members submit recipes
  - Uses Expo Push Notifications service (works with EAS builds)
  - Notification channels for Android (Recipe Submissions)
  - Tap notification to navigate directly to Household screen
  - Push token management: saved on login, removed on logout
  - **Firebase/FCM Setup Required**: Push notifications require Firebase Cloud Messaging:
    1. Create Firebase project + add Android app (package: `com.mealmate.app`)
    2. Download `google-services.json` → place in `frontend/` (safe to commit, public config only)
    3. Add `googleServicesFile: './google-services.json'` to android config in `app.config.js`
    4. Generate FCM V1 Service Account Key from Firebase Console → Project Settings → Service Accounts
    5. Upload to Expo: `eas credentials -p android` → Push Notifications → FCM V1 Service Account Key
    6. Also upload via Expo dashboard: Project → Credentials → Android → Push Notifications (FCM V1)
  - **Deploys via the Docker lab**: build + restart both containers on this box with `./scripts/lab-deploy.sh` (`docker compose up -d --build`); no GitHub Actions / Docker Hub / Railway step anymore.
- **🛒 Grocery List Generation** - Generate shopping lists from planned meals
  - AI-powered ingredient parsing and categorization (Claude Sonnet 4)
  - Regex fallback parser when API key unavailable
  - Ingredient aggregation across multiple recipes
  - Store Mode with category-grouped checklist and progress tracking
  - Add custom items, drill-down to see which recipes use each ingredient
  - Grocery list history with completion percentages
  - New bottom tab with Picker, Store Mode, and History screens
- **🌟 My Staples** - Personal staples list for quick grocery shopping
  - Auto-saves custom items added to grocery lists as staples (passive history)
  - Dedicated "My Staples" screen with search, category filters, and bulk-select
  - Bulk-add selected staples to any grocery list in one tap
  - Enhanced add-item modal with quantity and category picker in Store Mode
  - "Add Staples" button in Store Mode for quick access
  - 'Household' category added to grocery items and staples
- **🏪 Store Layouts** - Per-store category ordering in Store Mode
  - Users select a store to reorder grocery categories to match the store's physical layout
  - 6 default stores seeded on first use (Aldi, Meijer, Kroger, Walmart, Whole Foods, Trader Joe's)
  - Manage Stores modal with category reordering via up/down arrows
  - Add custom stores, delete stores
  - Last-used store auto-selected on next visit (isDefault flag)
  - Store selector chip row in Store Mode below progress bar
- Recipe creation refactor (ingredients/directions optional)
- Plan count tracking on recipes
- Clickable stat cards for navigation

---

## 📋 Future Roadmap

- [x] AI-powered suggestions (completed - optional Claude API integration)
- [x] Grocery list generation from meal plans (completed)
- [x] Push notifications for recipe submissions (completed)
- [x] Recipe photo import with AI (completed)
- [ ] Household analytics and insights
- [ ] Recipe sharing beyond households
- [ ] Meal plan templates and presets
- [ ] Recipe ratings and favorites

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
- **Deployment**: the app is self-hosted on Eric's Docker lab (this machine) behind the shared Cloudflare Tunnel — web PWA at `https://mealmate.mooseflip.com`, API at `https://mealmate-api.mooseflip.com`. Redeploy with `./scripts/lab-deploy.sh`.

---

**For implementation details, see the modular documentation in `.claude/rules/`**
