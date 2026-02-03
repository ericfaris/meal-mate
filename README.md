# Meal Mate - Smart Meal Planning App

A React Native mobile app for intelligent weekly meal planning with household collaboration, AI-powered features, and grocery list generation. Built with Node.js backend and MongoDB Atlas database.

**Version:** 0.12.1
**Last Updated:** February 2026

## ✨ Key Features

- 🍽️ **Recipe Management** - Import from URLs or photos (AI-powered extraction)
- 🤖 **Smart Suggestions** - AI-enhanced weekly meal planning with preferences
- 📅 **Flexible Planning** - Plan meals for any date (past, present, future)
- 👥 **Household Collaboration** - Share recipes and plans with family members
- 🛒 **Grocery Lists** - Auto-generate shopping lists with store layouts
- 🌟 **My Staples** - Quick-add frequently purchased items
- 🔔 **Push Notifications** - Admin alerts for recipe submissions
- 🔐 **Secure Authentication** - Email/password and Google OAuth

## Project Structure

```
meal-mate/
├── version.json          # Single source of truth for versioning
├── scripts/
│   └── bump-version.js  # Version management script
├── backend/             # Node.js + Express API server
│   ├── src/
│   │   ├── config/      # Database, OAuth configuration
│   │   ├── models/      # Mongoose schemas (User, Recipe, Plan, etc.)
│   │   ├── routes/      # API route definitions
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic (suggestions, parsing, etc.)
│   │   ├── middleware/  # Auth, validation
│   │   ├── app.ts       # Express app setup
│   │   └── server.ts    # Server entry point
│   ├── Dockerfile       # Docker build configuration
│   └── package.json
│
└── frontend/            # React Native + Expo app
    ├── src/
    │   ├── config/      # API configuration
    │   ├── navigation/  # React Navigation (tabs, stacks)
    │   ├── screens/     # App screens (Home, Recipes, Planner, etc.)
    │   ├── components/  # Reusable UI components
    │   ├── services/    # API client services
    │   ├── contexts/    # Global state (Auth)
    │   └── types/       # TypeScript interfaces
    ├── app.config.js    # Expo configuration
    ├── eas.json         # EAS Build profiles
    └── package.json
```

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type safety
- **MongoDB Atlas** - Cloud NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Anthropic Claude API** - AI suggestions & photo import (optional)
- **Docker** - Containerization for Railway deployment

### Frontend
- **React Native 0.81.5** + **Expo ~54.0.0** - Mobile framework
- **TypeScript** - Type safety
- **React Navigation** - Bottom tabs + stack navigation
- **Axios** - HTTP client
- **expo-image** - Image caching
- **Expo Notifications** - Push notifications
- **@react-native-google-signin/google-signin** - Google OAuth

## Getting Started

### Prerequisites

- **Node.js 18+** installed
- **MongoDB Atlas** account (free tier)
- **Google Cloud** project for OAuth (optional)
- **Expo account** for EAS builds (optional)
- **Anthropic API key** for AI features (optional)

### Setup Instructions

#### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with password
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string from "Connect" → "Connect your application"

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with the following variables:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meal-mate
# JWT_SECRET=your-secret-key-at-least-32-characters
# PORT=3001
# ANTHROPIC_API_KEY=sk-ant-... (optional, for AI features)
# GOOGLE_CLIENT_ID=...apps.googleusercontent.com (optional, for OAuth)

# Start development server (with auto-reload)
npm run dev
```

The backend will run on `http://localhost:3001`

#### 3. Frontend Setup

**Get your local IP address:**
- **Windows**: Run `ipconfig` and find your WiFi adapter's IPv4 address
- **Mac/Linux**: Run `ifconfig` or `ip addr` and find your WiFi interface's IP

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Update src/config/api.ts with your local IP:
# export const API_BASE_URL = 'http://192.168.1.XXX:3001';
# (Replace XXX with your actual IP address)

# Start Expo development server
npm start
```

#### 4. Run on Your Device

**Option A: Expo Go (Quick Start)**
1. Install **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in terminal
3. The app will connect to your local backend via WiFi

**Option B: Development Build (For Google OAuth)**
```bash
cd frontend
npx expo run:android  # For Android
npx expo run:ios      # For iOS (Mac only)
```

## Development Workflow

### Two Terminal Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev  # Auto-restarts on file changes
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start    # Hot reload on device
```

### Iteration Loop

1. Edit React Native code → Instant reload on device
2. Edit backend code → nodemon auto-restarts in ~2s
3. Both changes visible immediately

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/google` - Google OAuth

### Recipes
- `GET /api/recipes` - List recipes (`?search=query&tags=tag1,tag2`)
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/import` - Import from URL
- `POST /api/recipes/import-photo` - Import from photo (AI, admin-only)

### Plans
- `GET /api/plans?start=YYYY-MM-DD&days=7` - Get plans for date range
- `PUT /api/plans/:date` - Create/update plan
- `DELETE /api/plans/:date` - Delete plan

### Households
- `GET /api/households` - Get household details
- `POST /api/households` - Create household
- `POST /api/households/join` - Join via invitation token
- `POST /api/households/invite` - Generate invitation
- `DELETE /api/households/leave` - Leave household

### Grocery Lists
- `POST /api/grocery-lists` - Generate from meal plans
- `GET /api/grocery-lists` - List all grocery lists
- `PUT /api/grocery-lists/:id/items/:index` - Check/edit item
- `POST /api/grocery-lists/:id/items` - Add custom item
- `POST /api/grocery-lists/:id/staples` - Bulk-add staples

### Staples & Stores
- `GET /api/staples` - Get user's staples
- `POST /api/staples` - Create/update staple
- `GET /api/stores` - Get store layouts
- `PUT /api/stores/:id` - Update store category order

See [CLAUDE.md](./CLAUDE.md) for complete API documentation.

## 📦 Database Schema

### User
```typescript
{
  email: string,
  passwordHash: string,
  name: string,
  householdId?: ObjectId,
  role: 'admin' | 'member',
  authProvider: 'local' | 'google' | 'apple',
  pushToken?: string
}
```

### Recipe
```typescript
{
  userId: ObjectId,
  title: string,
  imageUrl?: string,
  sourceUrl?: string,
  ingredientsText: string,
  directionsText: string,
  tags: string[],
  complexity?: 'simple' | 'medium' | 'complex',
  isVegetarian: boolean,
  prepTime?: number,
  cookTime?: number,
  lastUsedDate?: Date
}
```

### Plan
```typescript
{
  userId: ObjectId,
  date: string,              // "2026-01-11" (YYYY-MM-DD)
  recipeId?: ObjectId,
  label?: string,            // "Eating Out", "Leftovers", custom
  isConfirmed: boolean
}
```

### GroceryList
```typescript
{
  userId: ObjectId,
  name: string,
  items: [{
    name: string,
    quantity: string,
    category: string,
    checked: boolean,
    recipeIds: ObjectId[]
  }],
  status: 'active' | 'archived'
}
```

## 🚀 Building for Production

### Android APK Build

```bash
cd frontend

# Login to Expo (one-time)
npx eas-cli login

# Build APK for sideloading
npx eas-cli build --platform android --profile preview

# Download and install on device
# APK link provided in build output
```

### Backend Deployment (Railway)

The backend auto-deploys via GitHub Actions when changes are pushed to `main`:
1. Docker image is built and tagged with version from `version.json`
2. Pushed to Docker Hub
3. Railway pulls and deploys automatically

### Environment Variables for Production

**Backend (Railway):**
- `MONGODB_URI` - Production MongoDB Atlas connection
- `JWT_SECRET` - Secure secret key
- `ANTHROPIC_API_KEY` - For AI features
- `GOOGLE_CLIENT_ID` - For OAuth
- `NODE_ENV=production`

**Frontend (EAS Build):**
Update `frontend/src/config/api.ts` with production URL before building.

## 🔧 Common Issues

### Backend won't start
- ✅ Check MongoDB connection string in `.env`
- ✅ Ensure MongoDB Atlas allows your IP address (Network Access)
- ✅ Verify database user credentials are correct
- ✅ Check port 3001 is not already in use

### Frontend can't connect to backend
- ✅ Verify your local IP in `frontend/src/config/api.ts`
- ✅ Ensure phone and computer are on **same WiFi network**
- ✅ Check backend is running on port 3001
- ✅ Check Windows Firewall - add Node.js inbound rule
- ✅ Test backend in phone's browser first: `http://YOUR_IP:3001/health`

### APK can't connect to local backend (HTTP blocked)
- ✅ Enable cleartext traffic in `app.config.js`:
  ```json
  {
    "plugins": [
      ["expo-build-properties", {
        "android": { "usesCleartextTraffic": true }
      }]
    ]
  }
  ```

### Google Sign-In not working
- ✅ Requires development build (not Expo Go)
- ✅ Verify Google OAuth client ID is configured
- ✅ Check SHA-1 certificate fingerprint is added to Google Cloud project

### Changes not appearing
- **Backend**: Check if nodemon is watching files (restart with `npm run dev`)
- **Frontend**: Shake device and press "Reload" in dev menu, or restart with `r` in terminal

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project overview and architecture
- **[.claude/rules/](./claude/rules/)** - Detailed implementation guides:
  - `frontend.md` - React Native patterns and conventions
  - `backend.md` - Express/Node.js patterns
  - `database.md` - MongoDB schemas and queries
  - `api-design.md` - API endpoint documentation

## 🎯 Recent Updates (v0.12.1)

- ✅ **Recipe Photo Import** - AI-powered extraction using Claude Vision
- ✅ **Member Recipe Editing** - Household members can update recipes
- ✅ **Leftovers Plan Option** - Quick planning for leftover meals
- ✅ **Image Caching** - Migrated to expo-image for better performance
- ✅ **Grocery Store Layouts** - Per-store category ordering
- ✅ **My Staples** - Quick-add frequently purchased items
- ✅ **Push Notifications** - Admin alerts for recipe submissions
- ✅ **AI Meal Suggestions** - Optional Claude API integration

## 📋 Roadmap

- [ ] Push notifications for meal reminders
- [ ] Apple OAuth integration
- [ ] Recipe ratings and favorites
- [ ] Household analytics and insights
- [ ] Recipe sharing beyond households
- [ ] Meal plan templates and presets

## 📄 License

ISC

---

**Need Help?** Check [CLAUDE.md](./CLAUDE.md) for detailed implementation guides and troubleshooting.
