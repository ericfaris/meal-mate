---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.tsx"
  - "frontend/**/*.js"
  - "frontend/**/*.jsx"
---

# Frontend Development Rules (React Native/Expo)

## Tech Stack
- **React Native** 0.81.5
- **Expo** ~54.0.0
- **React Navigation** (Bottom tabs + Stack navigation)
- **TypeScript** for type safety
- **Axios** for HTTP requests

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
│   └── PlannerTab (Stack)
│       ├── PlannerHome
│       ├── Constraints
│       ├── Suggestions
│       ├── RecipePicker
│       └── Success
└── Settings (Modal)
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
  label?: string; // "Eating Out", "TBD"
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
- Token stored in Expo Secure Store
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
- Log errors to console for debugging
- Display loading states with ActivityIndicator

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
  → Store in AuthContext + SecureStore
  → Navigate to MainTabs
```

### Google OAuth Flow:
```
LoginScreen → Google Sign-In Button
  → expo-auth-session redirect
  → Google consent → Get ID token
  → Send to /api/auth/google
  → Backend validates → Returns JWT
  → Store token → Navigate to MainTabs
```

### Session Persistence:
- Check for token in SecureStore on app launch
- If valid, auto-login (silent authentication)
- If invalid/expired, show login screen

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
- Ingredients and directions
- Edit button → RecipeEntryScreen
- Metadata display (cook time, complexity, tags)

**RecipeEntryScreen**:
- Create/Edit mode support
- Form validation (title required)
- Image picker integration
- Tag management
- Complexity auto-detection

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
- Use `expo-image-picker` for selecting images
- Support camera and gallery
- Handle permissions properly
- Compress images before upload (if needed)

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

- Test on both iOS and Android
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
✅ Use environment variables (app.config.js)

❌ Don't store sensitive data in AsyncStorage
✅ Use Expo Secure Store for tokens

❌ Don't ignore loading and error states
✅ Always handle loading/error/success states

❌ Don't create new Date() without timezone handling
✅ Use dateUtils.ts helper functions

## Development Commands

```bash
npm start            # Start Expo dev server
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run build        # Build for production (EAS)
```
