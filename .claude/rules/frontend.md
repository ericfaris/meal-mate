---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.tsx"
  - "frontend/**/*.js"
  - "frontend/**/*.jsx"
---

# Frontend Development Rules (React Native Web + Vite)

## Tech Stack
- **React Native Web** 0.21 (React Native components rendered by react-dom;
  `react-native` is aliased to `react-native-web` in `vite.config.mts`)
- **Vite** for dev server + production build (no Expo, no Metro)
- **React Navigation** v6 (Bottom tabs + native-stack)
- **TypeScript** for type safety (`npm run typecheck`)
- **Vitest** for unit tests (`npm test`)
- **Axios** for HTTP requests
- Icons: `Ionicons` from `src/components/icons/Ionicons` (vendored font,
  same API as `@expo/vector-icons`)

## Project Structure

```
frontend/src/
├── App.tsx                          # Root component with auth routing
├── screens/                         # Screen components
│   ├── auth/                       # Login/Signup screens
│   ├── planning/                   # Meal planning flow screens
│   ├── HomeScreen.tsx
│   ├── PlannerScreen.tsx
│   ├── RecipesScreen.tsx
│   ├── RecipeDetailScreen.tsx
│   ├── RecipeEntryScreen.tsx
│   └── SettingsScreen.tsx
├── navigation/
│   └── BottomTabNavigator.tsx      # Navigation configuration
├── contexts/
│   └── AuthContext.tsx             # Global auth state
├── services/
│   ├── api/                        # API client methods
│   ├── auth/                       # Auth services (Google, etc.)
│   └── storage/                    # Local device storage
├── components/                     # Reusable UI components
├── theme/                          # Colors, spacing, typography
├── types/                          # TypeScript interfaces
└── utils/                          # Helper functions
```

## Navigation Structure

```
RootStack
├── MainTabs (BottomTabNavigator)
│   ├── HomeTab → HomeScreen
│   ├── RecipesTab (Stack)
│   │   ├── RecipesList
│   │   ├── RecipeDetail
│   │   └── RecipeEntry
│   ├── PlannerTab (Stack)
│   │   ├── PlannerHome
│   │   ├── Constraints
│   │   ├── Suggestions
│   │   ├── RecipePicker
│   │   └── Success
│   └── GroceryTab (Stack)
│       ├── GroceryPicker
│       ├── GroceryStoreMode
│       └── GroceryHistory
├── Settings (Modal)
└── Household (Modal)
```

## Core TypeScript Interfaces

```typescript
interface Recipe {
  _id: string;
  title: string;
  imageUrl?: string;
  ingredientsText?: string;
  directionsText?: string;
  tags: string[];
  complexity?: 'simple' | 'medium' | 'complex';
  isVegetarian?: boolean;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  planCount?: number;
  lastUsedDate?: string;
}

interface Plan {
  _id: string;
  date: string; // YYYY-MM-DD format
  recipeId?: Recipe;
  label?: string; // "Eating Out", "Leftovers", "TBD", custom
  isConfirmed: boolean;
}

interface User {
  _id: string;
  email: string;
  name: string;
  profilePicture?: string;
  authProvider: 'local' | 'google' | 'apple';
}
```

## State Management Patterns

### Global State
- Use `AuthContext` for user authentication and token management
- Token stored in `localStorage` (`services/storage`)
- Auto-login on app launch if token is valid

### Local State
- Use component `useState` for screen-specific state
- Use `useFocusEffect` for screen-specific data loading on navigation
- Use `useEffect` sparingly, prefer `useFocusEffect` for navigation-dependent effects

### Example:
```typescript
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  useCallback(() => {
    loadData();
  }, [])
);
```

## Data Fetching Patterns

### Always Follow This Pattern:
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await apiService.getData();
    // Handle data
  } catch (err: any) {
    setError(err.response?.data?.message || 'Something went wrong');
  } finally {
    setLoading(false);
  }
};
```

### Error Handling
- Always wrap API calls in try-catch
- Show user-friendly error messages via ErrorModal or Alert
- Log errors to console for debugging (see example below)
- Display loading states with ActivityIndicator
- Provide specific error messages for common network issues

#### Example Error Handling Pattern:

```typescript
try {
  console.log('[Auth] Attempting login to:', `${API_ENDPOINTS.auth}/login`);
  const response = await axios.post(`${API_ENDPOINTS.auth}/login`, credentials);
  console.log('[Auth] Login successful');
  return response.data;
} catch (error: any) {
  console.error('[Auth] Login error:', error);
  console.error('[Auth] Error details:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    code: error.code,
  });

  // Provide specific error messages
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    throw new Error('Connection timeout - please check your network connection');
  }
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    throw new Error('Network error - cannot reach server at ' + API_ENDPOINTS.auth);
  }

  throw new Error(error.response?.data?.error || error.message || 'Login failed');
}
```

**Why detailed error logging is important:**
- Helps diagnose network connectivity issues in production builds
- Console logs visible via USB debugging (`adb logcat`)
- Error codes (ECONNABORTED, ERR_NETWORK) indicate specific problems
- User sees helpful error messages instead of generic "Login failed"

### Pull-to-Refresh
Implement on main screens (Home, Recipes, Planner):
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchData();
  setRefreshing(false);
};

<ScrollView refreshControl={
  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}>
```

## Date Handling

### CRITICAL: Always Use YYYY-MM-DD Format
- Dates stored as strings, NOT timestamps
- Use `dateUtils.ts` helper functions for parsing
- Avoids timezone shift issues across devices

### Example:
```typescript
import { formatDate, parseDate } from '@/utils/dateUtils';

// Format date for API
const dateStr = formatDate(new Date()); // "2026-01-11"

// Parse date from API
const date = parseDate(plan.date);
```

## Authentication Flow

### Email/Password Flow:
```
LoginScreen → auth.login()
  → Backend validates
  → Returns JWT + user
  → Store in AuthContext + localStorage
  → Navigate to MainTabs
```

### Google OAuth Flow:
```
LoginScreen → Google Sign-In Button
  → GoogleSignInButton.tsx: @react-oauth/google GoogleOAuthProvider / GoogleLogin
  → User consent → Get ID token
  → services/auth/google.ts handleGoogleSignIn
  → Send to /api/auth/google
  → Backend validates → Returns JWT → Store token → MainTabs
```

**Library**: `@react-oauth/google`.
**Configuration**: the button fetches the client ID at runtime from
`GET /api/auth/google/config` (backend `GOOGLE_WEB_CLIENT_ID`); no client ID
renders no button.

### Session Persistence:
- Check for token in localStorage on app launch
- If valid, auto-login (silent authentication)
- If invalid/expired, show login screen

### Token Expiration & App Resume Handling:
The app handles token expiration gracefully to avoid showing empty data:

1. **Axios Interceptor** (`config/api.ts`):
   - Detects 401 responses from any API call
   - Clears auth from SecureStore
   - Calls `authExpiredCallback` to notify AuthContext

2. **AuthContext Callback**:
   - Registers callback via `setAuthExpiredCallback()`
   - When called, immediately sets `user` to `null`
   - This triggers navigation to login screen

3. **AppState Listener** (foreground detection):
   - Listens for app coming back to foreground
   - Re-validates token by calling `/api/auth/me`
   - If token expired while backgrounded, clears auth and redirects to login
   - Gracefully handles network errors (doesn't log out on temporary failures)

```typescript
// Pattern: Auth expiration callback in api.ts
let authExpiredCallback: (() => void) | null = null;
export const setAuthExpiredCallback = (callback: (() => void) | null) => {
  authExpiredCallback = callback;
};

// In axios interceptor:
if (error.response?.status === 401) {
  await clearAuth();
  if (authExpiredCallback) {
    authExpiredCallback();
  }
}

// Pattern: AppState listener in AuthContext
AppState.addEventListener('change', async (nextAppState) => {
  if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
    await validateAuthOnResume();
  }
});
```

## Screen Development Guidelines

### Screen Component Structure:
```typescript
export default function MyScreen({ navigation, route }) {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. Context/hooks
  const { user } = useAuth();

  // 3. Data fetching
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 4. Event handlers
  const handleAction = async () => { ... };

  // 5. Render
  return (
    <SafeAreaView>
      {loading ? <ActivityIndicator /> : <Content />}
    </SafeAreaView>
  );
}
```

### Common Patterns:

**HomeScreen**:
- Time-aware greeting based on hour
- **Admin notification banner** for pending recipe submissions (if admin + pending > 0)
- Display "Tonight's Dinner" (today's plan)
- Quick action buttons (Plan, Add Recipe, Browse)
- Recipe spotlight/inspiration
- Stats cards (clickable for navigation)
- Pull-to-refresh

**RecipesScreen**:
- Search and filter by title/tags
- Display plan count badges
- Navigate to detail/edit screens
- Sectioned display (optional)

**PlannerScreen**:
- Week-by-week navigation (prev/next buttons)
- Display 7-day cards with recipes or labels
- Suggest (AI) and Pick (manual) buttons per day
- Disable buttons for past dates
- Confirm plans functionality

**RecipeDetailScreen**:

- Full recipe view with image
- **Ingredients displayed as bulleted list** (one bullet per ingredient)
- **Directions displayed as numbered or bulleted list**
  - Auto-detects if steps are already numbered
  - Cleans leading numbers from text if present
  - Falls back to bullets if not numbered
- Edit button → RecipeEntryScreen
- Metadata display (cook time, complexity, tags)

**List Parsing Logic**:

- Splits text by newlines first
- Falls back to semicolon or period delimiters if needed
- Helper functions: `parseListItems()`, `hasNumberedSteps()`, `cleanListItem()`

**RecipeEntryScreen**:
- Create/Edit mode support
- **Four import methods via tabs**:
  - URL: Import from recipe website
  - Browse Web: Search and import recipes
  - Photo: AI-powered extraction from images (admin-only)
  - Manual: Enter recipe details manually
- Form validation (title required)
- Image picker integration
- Tag management
- Photo import uses Claude Vision API
- Admin-only restriction on photo import tab

## Navigation Best Practices

### Use Type-Safe Navigation:
```typescript
// Define navigation types
type RecipesStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipeId: string };
  RecipeEntry: { recipeId?: string }; // undefined = create mode
};

// Use in component
import { StackScreenProps } from '@react-navigation/stack';
type Props = StackScreenProps<RecipesStackParamList, 'RecipeDetail'>;

function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipeId } = route.params;
  // ...
}
```

### Navigation Actions:
```typescript
// Navigate to screen
navigation.navigate('RecipeDetail', { recipeId: '123' });

// Go back
navigation.goBack();

// Replace current screen (no back)
navigation.replace('Home');

// Reset navigation stack
navigation.reset({
  index: 0,
  routes: [{ name: 'MainTabs' }],
});
```

## Styling & Theme

### Use Theme Constants:
```typescript
import { colors, spacing, typography } from '@/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
});
```

### Responsive Design:
- Use `Dimensions` for screen size
- Test on multiple screen sizes
- Use `flex` for responsive layouts
- Avoid hardcoded widths/heights

## Common Components & Utilities

### Modal Usage:
- Use ErrorModal for error messages
- Use confirmation modals for destructive actions
- Always provide dismiss/cancel option

### Tutorial System:
- Check `tutorialStorage.ts` for first-time user flags
- Show tutorial overlays on first screen visit
- Mark as completed after user acknowledges

### Image Handling:
- Use React Native's `Image` (browser HTTP caching applies)
- Use `pickImageFile()` from `utils/fileUtils.ts` to choose images (a hidden
  `<input type="file" accept="image/*">`; mobile browsers offer the camera)
- Use `downloadTextFile()` from `utils/fileUtils.ts` for file exports
- Bundled images: `import url from '../../assets/x.png'`, then
  `source={{ uri: url }}` — never `require()` (Vite is ESM-only)
- Photo import for recipes (multipart/form-data upload)
- Admin-only access to photo import feature

## API Integration

### Service Layer Pattern:
All API calls go through service modules in `services/api/`:

```typescript
// services/api/recipes.ts
export const recipesApi = {
  getAll: async (params?: { search?: string; tags?: string[] }) => {
    const response = await api.get('/recipes', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  },

  create: async (recipe: RecipeInput) => {
    const response = await api.post('/recipes', recipe);
    return response.data;
  },
};
```

### Auth Header Injection:
Axios instance automatically includes JWT token:
```typescript
// Configured in api/index.ts
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Performance Optimization

### Avoid Unnecessary Re-renders:
- Use `React.memo` for pure components
- Use `useCallback` for callbacks passed to children
- Use `useMemo` for expensive computations

### List Optimization:
```typescript
<FlatList
  data={recipes}
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => <RecipeCard recipe={item} />}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## Testing Considerations

- Test on mobile and desktop viewport widths (installed PWA + browser)
- Test with slow network (throttle network in dev tools)
- Test error states (network failures, invalid data)
- Test edge cases (empty states, long text, special characters)
- Test authentication flow (login, logout, token expiry)

## Code Style

### Naming Conventions:
- Components: PascalCase (`HomeScreen.tsx`)
- Functions: camelCase (`handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Interfaces: PascalCase (`Recipe`, `Plan`)

### Import Order:
1. React/React Native imports
2. Third-party libraries
3. Local components
4. Services/utilities
5. Types
6. Styles

### Component File Structure:
```typescript
// 1. Imports
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Component
export default function MyComponent({ title }: Props) {
  // Component logic
}

// 4. Styles
const styles = StyleSheet.create({
  // ...
});
```

## Common Pitfalls to Avoid

❌ Don't use timestamps for dates (timezone issues)
✅ Use YYYY-MM-DD string format

❌ Don't fetch data in `useEffect` with navigation
✅ Use `useFocusEffect` for navigation-dependent loading

❌ Don't hardcode API URLs
✅ Use `VITE_*` build-time env vars (`import.meta.env`)

❌ Don't ignore loading and error states
✅ Always handle loading/error/success states

❌ Don't create new Date() without timezone handling
✅ Use dateUtils.ts helper functions

## Development Commands

```bash
npm run dev          # Vite dev server on :8081 (backend on :3001)
npm run build        # Production build into dist/
npm run typecheck    # tsc --noEmit
npm test             # Vitest + logo asset tests
```

## Building for Production (Web PWA)

The app ships **only** as an installable web PWA. Expo (and the native
Android/iOS build path) has been removed entirely.

- **Build**: `frontend/Dockerfile.web` runs `npm ci` + `npm run build` (Vite)
  → static `dist/`, served by nginx.
- **PWA layer**: Vite copies `frontend/public/` (`manifest.json`,
  `service-worker.js`, `icons/`, `fonts/`) into `dist/`;
  `frontend/scripts/inject-pwa.js` then injects the manifest link + SW
  registration into `dist/index.html` and stamps the SW cache version.
  `nginx.conf.template` sets `Cache-Control: no-cache` on `index.html`,
  `manifest.json`, and `service-worker.js` so updates are never stranded.
- **API URL**: `VITE_API_URL=https://mealmate-api.mooseflip.com` is a build
  arg in `docker-compose.yml`; `src/config/api.ts` also hard-falls-back to that
  production URL in production builds.
- **Version**: `APP_VERSION`/`BUILD_NUMBER` build args are baked in by
  `vite.config.mts` (`src/config/version.ts`).
- **Deploy**: from the repo root run `./scripts/lab-deploy.sh` (stamps
  `APP_VERSION`/`BUILD_NUMBER` from `version.json`, then
  `docker compose up -d --build`). Public URLs are
  `https://mealmate.mooseflip.com` (web) and
  `https://mealmate-api.mooseflip.com` (API), exposed via the shared Cloudflare
  Tunnel on the self-hosted Docker lab.
