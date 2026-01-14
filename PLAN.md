# Eat Out Roulette - Implementation Plan

## Feature Overview

A fun, interactive "slot machine" experience to help households decide where to eat on date night. Users manage a shared list of restaurants, then spin to get a random selection with weighted randomization that favors less-recently-visited places.

---

## Design Decisions

- **Household sharing**: Yes - all members can add/edit/delete restaurants
- **History tracking**: Yes - track visits and show stats
- **Exclusion logic**: Yes - weight recently-visited restaurants lower
- **Navigation**: New 4th bottom tab
- **Filters**: No filters before spinning (keep it simple)

---

## Phase 1: Backend Implementation

### 1.1 Create Restaurant Model

**File**: `backend/src/models/restaurant.ts`

```typescript
{
  _id: ObjectId,

  // Ownership (same pattern as Recipe)
  userId: ObjectId,           // Creator
  householdId?: ObjectId,     // Shared with household (nullable for solo users)

  // Core fields
  name: string,               // Required - "Olive Garden"
  cuisine?: string,           // Optional - "Italian"
  priceRange?: 1 | 2 | 3 | 4, // Optional - $ to $$$$
  notes?: string,             // Optional - "Great for anniversaries"

  // Tracking
  lastVisitedDate?: string,   // YYYY-MM-DD format (like Plan dates)
  visitCount: number,         // Default: 0

  // Status
  isActive: boolean,          // Default: true (can temporarily exclude)

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ odId: 1 }` - User isolation
- `{ odId: 1, householdId: 1 }` - Household queries
- `{ householdId: 1 }` - Household-wide queries
- `{ lastVisitedDate: 1 }` - For weighted selection

### 1.2 Create Restaurant Controller

**File**: `backend/src/controllers/restaurants.ts`

| Function | Description |
|----------|-------------|
| `getRestaurants` | Get all restaurants (user's own + household shared) |
| `getRestaurant` | Get single restaurant by ID |
| `createRestaurant` | Create new restaurant |
| `updateRestaurant` | Update restaurant (any household member) |
| `deleteRestaurant` | Delete restaurant (any household member) |
| `recordVisit` | Update lastVisitedDate and increment visitCount |
| `getStats` | Get visit statistics for display |

**Household Query Pattern** (same as recipes):
```typescript
const restaurants = await Restaurant.find({
  $or: [
    { userId: req.userId },
    { householdId: user.householdId }
  ],
  isActive: true
});
```

### 1.3 Create Restaurant Routes

**File**: `backend/src/routes/restaurants.ts`

```
GET    /api/restaurants           # List all (user + household)
GET    /api/restaurants/:id       # Get single
POST   /api/restaurants           # Create new
PUT    /api/restaurants/:id       # Update
DELETE /api/restaurants/:id       # Delete
POST   /api/restaurants/:id/visit # Record visit (after spin selection)
GET    /api/restaurants/stats     # Get aggregate stats
```

### 1.4 Weighted Selection Algorithm

**File**: `backend/src/services/restaurantService.ts`

```typescript
function selectWeightedRestaurant(restaurants: Restaurant[]): Restaurant {
  // Weight calculation:
  // - Never visited: weight = 10
  // - Visited 30+ days ago: weight = 8
  // - Visited 14-30 days ago: weight = 5
  // - Visited 7-14 days ago: weight = 3
  // - Visited < 7 days ago: weight = 1

  // Random selection based on weights
}
```

---

## Phase 2: Frontend API Service

### 2.1 Create Restaurant Service

**File**: `frontend/src/services/api/restaurants.ts`

```typescript
export const restaurantApi = {
  getAll: () => Promise<Restaurant[]>,
  getById: (id: string) => Promise<Restaurant>,
  create: (data: RestaurantInput) => Promise<Restaurant>,
  update: (id: string, data: Partial<RestaurantInput>) => Promise<Restaurant>,
  delete: (id: string) => Promise<void>,
  recordVisit: (id: string) => Promise<Restaurant>,
  getStats: () => Promise<RestaurantStats>,
};
```

### 2.2 Add TypeScript Types

**File**: `frontend/src/types/index.ts` (add to existing)

```typescript
export interface Restaurant {
  _id: string;
  userId: string;
  householdId?: string;
  name: string;
  cuisine?: string;
  priceRange?: 1 | 2 | 3 | 4;
  notes?: string;
  lastVisitedDate?: string;
  visitCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantInput {
  name: string;
  cuisine?: string;
  priceRange?: 1 | 2 | 3 | 4;
  notes?: string;
  isActive?: boolean;
}

export interface RestaurantStats {
  totalRestaurants: number;
  totalVisits: number;
  mostVisited?: Restaurant;
  leastRecent?: Restaurant;
}
```

---

## Phase 3: Slot Machine Component

### 3.1 Create SlotMachine Component

**File**: `frontend/src/components/SlotMachine.tsx`

**Props**:
```typescript
interface SlotMachineProps {
  items: string[];           // Restaurant names
  onSpinComplete: (index: number) => void;
  isSpinning: boolean;
  selectedIndex?: number;    // Pre-determined winner
}
```

**Animation Details** (using react-native-reanimated):
- Vertical FlatList with restaurant names
- On spin: rapid scroll animation with easing
- Duration: ~3 seconds
- Slow-down curve: cubic-bezier for suspense
- Haptic feedback on stop (expo-haptics)

**Visual Design**:
- Dark gradient background (#1a1a2e → #16213e)
- Glowing border effect
- Center highlight row (the "winner" position)
- Blur effect on items above/below center

### 3.2 Animation Sequence

```
1. User taps "SPIN!"
2. Request weighted selection from parent (or calculate locally)
3. Start rapid scroll animation
4. Items cycle through visible area (3-5 visible at once)
5. Gradually decelerate over 2.5-3 seconds
6. Land precisely on selected restaurant
7. Trigger haptic feedback
8. Call onSpinComplete callback
```

---

## Phase 4: Roulette Screen

### 4.1 Create RouletteScreen

**File**: `frontend/src/screens/roulette/RouletteScreen.tsx`

**States**:
- `idle` - Showing slot machine, ready to spin
- `spinning` - Animation in progress
- `result` - Showing winner with confetti

**Layout**:
```
┌─────────────────────────────┐
│  Header: "Date Night 🎰"    │
│  [Manage List button]       │
├─────────────────────────────┤
│                             │
│   ┌───────────────────┐     │
│   │   Restaurant 1    │     │  ← Slot machine
│   │ ► RESTAURANT 2 ◄  │     │  ← Highlighted winner row
│   │   Restaurant 3    │     │
│   └───────────────────────┘ │
│                             │
│      [ 🎰 SPIN! ]           │  ← Big glowing button
│                             │
├─────────────────────────────┤
│  Stats: "12 restaurants"    │
│  "Last spin: Olive Garden"  │
└─────────────────────────────┘
```

**Result State Layout**:
```
┌─────────────────────────────┐
│  🎉 CONFETTI 🎉             │
├─────────────────────────────┤
│                             │
│      "Tonight's Pick!"      │
│                             │
│   ┌───────────────────┐     │
│   │  🍝 Olive Garden  │     │
│   │  Italian • $$$    │     │
│   │  Last: 2 weeks ago│     │
│   │  Visits: 5 times  │     │
│   └───────────────────┘     │
│                             │
│  [Spin Again] [Pick This!]  │
│                             │
└─────────────────────────────┘
```

**Empty State**:
- Fun illustration/emoji (🍽️🎰)
- "No restaurants yet!"
- "Add your favorite date spots to get started"
- [Add First Restaurant] button

### 4.2 Weighted Selection (Client-Side)

Calculate weights based on `lastVisitedDate`:
```typescript
function calculateWeight(restaurant: Restaurant): number {
  if (!restaurant.lastVisitedDate) return 10;

  const daysSinceVisit = daysBetween(restaurant.lastVisitedDate, today);

  if (daysSinceVisit > 30) return 8;
  if (daysSinceVisit > 14) return 5;
  if (daysSinceVisit > 7) return 3;
  return 1;
}

function selectWeightedRandom(restaurants: Restaurant[]): Restaurant {
  const weights = restaurants.map(calculateWeight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < restaurants.length; i++) {
    random -= weights[i];
    if (random <= 0) return restaurants[i];
  }
  return restaurants[restaurants.length - 1];
}
```

---

## Phase 5: Restaurant List Screen

### 5.1 Create RestaurantsListScreen

**File**: `frontend/src/screens/roulette/RestaurantsListScreen.tsx`

**Features**:
- List of all restaurants (active and inactive)
- Search/filter by name
- Add new restaurant (FAB or header button)
- Tap to edit
- Swipe to delete (with confirmation)
- Toggle active/inactive status
- Show visit count and last visited date

**Card Design**:
```
┌─────────────────────────────────────┐
│ 🍝 Olive Garden              $$$ │
│ Italian                           │
│ Last: Jan 5 • Visited 5 times     │
│                          [Toggle] │
└─────────────────────────────────────┘
```

### 5.2 Create/Edit Restaurant Modal

**File**: `frontend/src/components/RestaurantModal.tsx`

**Fields**:
- Name (required, text input)
- Cuisine (optional, text input or picker)
- Price Range (optional, 1-4 selector: $ $$ $$$ $$$$)
- Notes (optional, multiline text)
- Active toggle

---

## Phase 6: Navigation Integration

### 6.1 Update Navigation Types

**File**: `frontend/src/navigation/BottomTabNavigator.tsx`

Add to `RootTabParamList`:
```typescript
export type RootTabParamList = {
  HomeTab: undefined;
  RecipesTab: undefined;
  PlannerTab: undefined;
  RouletteTab: undefined;  // NEW
};
```

Add new stack:
```typescript
export type RouletteStackParamList = {
  RouletteHome: undefined;
  RestaurantsList: undefined;
  RestaurantEntry: { restaurant?: Restaurant; mode?: 'create' | 'edit' };
};
```

### 6.2 Add Bottom Tab

**Icon**: `dice` or `game-controller` (Ionicons)
**Label**: "Date Night" or "Roulette"

Tab order: Home | Recipes | Planner | **Roulette**

### 6.3 Create Stack Navigator

```typescript
function RouletteStackNavigator() {
  return (
    <RouletteStack.Navigator>
      <RouletteStack.Screen
        name="RouletteHome"
        component={RouletteScreen}
        options={{ title: 'Date Night' }}
      />
      <RouletteStack.Screen
        name="RestaurantsList"
        component={RestaurantsListScreen}
        options={{ title: 'My Restaurants' }}
      />
      <RouletteStack.Screen
        name="RestaurantEntry"
        component={RestaurantEntryScreen}
        options={{ title: 'Add Restaurant' }}
      />
    </RouletteStack.Navigator>
  );
}
```

---

## Phase 7: Polish & Integration

### 7.1 Home Screen Integration

Add to Quick Actions on HomeScreen:
```typescript
<TouchableOpacity onPress={() => navigation.navigate('RouletteTab')}>
  <View style={[styles.actionIcon, { backgroundColor: '#2D1B4E' }]}>
    <Ionicons name="dice" size={24} color="#9D4EDD" />
  </View>
  <Text>Date Night</Text>
</TouchableOpacity>
```

### 7.2 Confetti Integration

Reuse existing `react-native-confetti-cannon` pattern from SuccessScreen:
```typescript
<ConfettiCannon
  ref={confettiRef}
  count={100}
  origin={{ x: screenWidth / 2, y: -10 }}
  colors={['#9D4EDD', '#E040FB', '#FFD700', colors.primary]}
  fadeOut={true}
/>
```

### 7.3 Haptic Feedback

Add `expo-haptics` for spin completion:
```typescript
import * as Haptics from 'expo-haptics';

// On spin complete
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

## Phase 8: Documentation Update

### 8.1 Update CLAUDE.md

Add to Core Features:
```markdown
- 🎰 **Date Night Roulette** - Random restaurant picker with weighted selection
```

Add to Core Data Models:
```markdown
### Restaurant
- User/household-owned restaurant list
- Tracks visit history for weighted selection
- Shared across household members
```

Add to API Endpoints:
```markdown
### Restaurants
GET    /api/restaurants           # List all
POST   /api/restaurants           # Create
PUT    /api/restaurants/:id       # Update
DELETE /api/restaurants/:id       # Delete
POST   /api/restaurants/:id/visit # Record visit
```

---

## Implementation Order

| Step | Task | Estimated Effort |
|------|------|------------------|
| 1 | Backend: Restaurant model | Small |
| 2 | Backend: Restaurant controller & routes | Medium |
| 3 | Frontend: TypeScript types | Small |
| 4 | Frontend: Restaurant API service | Small |
| 5 | Frontend: RestaurantsListScreen | Medium |
| 6 | Frontend: RestaurantEntry modal/screen | Medium |
| 7 | Frontend: SlotMachine component | Large |
| 8 | Frontend: RouletteScreen | Medium |
| 9 | Navigation: Add RouletteTab | Small |
| 10 | Polish: Confetti, haptics, animations | Small |
| 11 | HomeScreen: Add quick action | Small |
| 12 | Documentation: Update CLAUDE.md | Small |

---

## Files to Create

### Backend (4 files)
- `backend/src/models/restaurant.ts`
- `backend/src/controllers/restaurants.ts`
- `backend/src/routes/restaurants.ts`
- `backend/src/services/restaurantService.ts`

### Frontend (6 files)
- `frontend/src/types/restaurant.ts` (or add to index.ts)
- `frontend/src/services/api/restaurants.ts`
- `frontend/src/screens/roulette/RouletteScreen.tsx`
- `frontend/src/screens/roulette/RestaurantsListScreen.tsx`
- `frontend/src/screens/roulette/RestaurantEntryScreen.tsx`
- `frontend/src/components/SlotMachine.tsx`

### Files to Modify
- `frontend/src/navigation/BottomTabNavigator.tsx` - Add 4th tab
- `frontend/src/screens/HomeScreen.tsx` - Add quick action
- `backend/src/app.ts` - Register restaurant routes
- `CLAUDE.md` - Document new feature

---

## Open Questions / Future Enhancements

1. **Map integration?** Link to Google Maps for directions
2. **Share result?** Share tonight's pick via text/social
3. **Cuisine presets?** Quick-add common cuisines (Italian, Mexican, etc.)
4. **Photos?** Add restaurant photos (from URL or camera)
5. **Ratings?** Personal rating after visits

---

## Ready for Implementation

This plan is ready for approval. Once approved, I'll implement in the order specified above, starting with the backend model and working through to the UI polish.
