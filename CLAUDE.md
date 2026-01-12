# Meal Mate - Project Overview

*Last Updated: 2026-01-11*

---

## 🎯 What is Meal Mate?

**Meal Mate** is a React Native mobile application for intelligent weekly meal planning. It helps users create, manage, and organize recipes while providing AI-powered meal suggestions based on preferences and constraints.

### Core Features
- 🍽️ Recipe management with URL import
- 🤖 Smart weekly meal suggestions
- 📅 Flexible meal planning (past, present, future)
- 🔐 Secure authentication (Email/Password + Google OAuth)
- 📱 Native mobile app (iOS/Android via Expo)

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
├── frontend/               # React Native app
│   └── src/
│       ├── screens/       # Screen components
│       ├── navigation/    # React Navigation setup
│       ├── services/      # API clients
│       ├── contexts/      # Global state (Auth)
│       └── components/    # Reusable UI
│
├── backend/               # Node.js API
│   └── src/
│       ├── models/       # Mongoose schemas
│       ├── controllers/  # Request handlers
│       ├── routes/       # API endpoints
│       ├── services/     # Business logic
│       └── middleware/   # Auth, etc.
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
| **Mobile** | React Navigation, Expo Secure Store |

---

## 🗄️ Core Data Models

### Recipe
- User-owned recipes with ingredients, directions, images
- Tags, complexity (simple/medium/complex), dietary flags
- Tracks `lastUsedDate` for suggestion algorithm
- `planCount` computed via aggregation

### Plan
- One plan per user per date (unique index)
- Date stored as YYYY-MM-DD string (not Date object)
- Can reference a Recipe OR have a text label ("Eating Out")
- Confirmed plans update recipe's `lastUsedDate`

### User
- Email/password or OAuth (Google, Apple)
- JWT token-based authentication
- Household support (future multi-user feature)

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

### Suggestions
```
POST   /api/suggestions/generate    # Week of suggestions
POST   /api/suggestions/alternative # Get alternative
POST   /api/suggestions/approve     # Save as plans
```

See @.claude/rules/api-design.md for full API documentation.

---

## 🧠 Key Business Logic

### Suggestion Algorithm
**Location**: `backend/src/services/suggestionService.ts`

Generates intelligent meal suggestions with constraints:
- Avoid repeats (10-day lookback window on `lastUsedDate`)
- Filter by vegetarian preference
- Prefer simple recipes (sort by complexity)
- Skip specific days (eating out, etc.)
- Shuffle for variety

### Recipe Import
**Location**: `backend/src/controllers/recipeImport.ts`

1. Try `recipe-scraper` library (primary)
2. Fall back to custom Cheerio parser
3. Auto-detect complexity:
   - Simple: ≤5 ingredients AND ≤20 min cook
   - Complex: >10 ingredients OR >60 min cook
   - Medium: everything else

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
✅ **JWT Authentication**: Tokens with 7-day expiry
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

Current branch: `google-oauth`

Recent changes:
- **Google OAuth Migration** - Migrated from deprecated `expo-auth-session` to `@react-native-google-signin/google-signin`
- **Android OAuth Fix** - Resolved "invalid_request" error by using native Google Sign-In SDK
- **SHA-1 Configuration** - Properly configured Android OAuth client with SHA-1 certificate fingerprint
- **Logout Enhancement** - Added Google sign-out to logout flow
- **Android APK build configuration** - HTTP cleartext traffic enabled for local development
- **Enhanced error logging** - Detailed network error messages in auth service
- Recipe creation refactor (ingredients/directions optional)
- Plan count tracking on recipes
- Clickable stat cards for navigation

---

## 📋 Future Roadmap

- [ ] Household/multi-user support
- [ ] AI-powered suggestions (Anthropic Claude API)
- [ ] Grocery list generation
- [ ] Push notifications
- [ ] Apple OAuth refinement
- [ ] EAS Build for App Store

---

## 💡 Quick Reference

### Common Operations

**Add a new API endpoint:**
1. Define route in `backend/src/routes/`
2. Create controller in `backend/src/controllers/`
3. Add service method in `frontend/src/services/api/`
4. See @.claude/rules/api-design.md for conventions

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
