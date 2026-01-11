---
paths:
  - "backend/src/models/**/*.ts"
  - "backend/src/config/db.ts"
---

# Database Rules (MongoDB/Mongoose)

## Database: MongoDB Atlas

Cloud-hosted MongoDB instance with Mongoose ODM for schema modeling.

## Connection Configuration

### Database Setup (`config/db.ts`):
```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
```

### Connection String Format:
```
mongodb+srv://username:password@cluster.mongodb.net/meal-mate?retryWrites=true&w=majority
```

## Schema Models

### User Model (`models/user.ts`)

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed, required),
  passwordHash: string (for local auth only),
  name: string (required),
  householdId?: ObjectId (ref: Household),
  role: 'admin' | 'member' (default: 'admin'),
  authProvider: 'local' | 'google' | 'apple' (required),
  providerId?: string (OAuth provider user ID),
  oauthTokens?: {
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  },
  profilePicture?: string,
  emailVerified: boolean (default: false),
  lastLoginAt?: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `email`: unique
- `providerId`: for OAuth lookups
- `householdId`: for multi-user queries (future)

**Validations**:
- Email format validation
- Password required if authProvider is 'local'
- providerId required if authProvider is 'google' or 'apple'

### Recipe Model (`models/recipe.ts`)

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  title: string (required, trimmed, indexed),
  imageUrl?: string,
  sourceUrl?: string,
  ingredientsText: string (default: ''),
  directionsText: string (default: ''),
  notes?: string,
  tags: string[] (default: [], indexed),
  lastUsedDate?: Date (indexed),
  complexity?: 'simple' | 'medium' | 'complex',
  isVegetarian: boolean (default: false),
  prepTime?: number (minutes),
  cookTime?: number (minutes),
  servings?: number,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Compound Indexes** (CRITICAL for performance):
```typescript
// Text search on title
recipeSchema.index({ userId: 1, title: 'text' });

// Tag filtering
recipeSchema.index({ userId: 1, tags: 1 });

// Suggestion algorithm (lastUsedDate queries)
recipeSchema.index({ userId: 1, lastUsedDate: 1 });

// Complexity filtering
recipeSchema.index({ userId: 1, complexity: 1 });

// Vegetarian filtering
recipeSchema.index({ userId: 1, isVegetarian: 1 });
```

**Validations**:
- Title required and non-empty
- userId must be valid ObjectId
- Complexity must be one of: 'simple', 'medium', 'complex'
- prepTime, cookTime, servings must be positive numbers if provided

**Virtual Fields**:
```typescript
recipeSchema.virtual('totalTime').get(function() {
  return (this.prepTime || 0) + (this.cookTime || 0);
});

// Note: planCount is computed via aggregation, not stored
```

### Plan Model (`models/plan.ts`)

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  date: string (YYYY-MM-DD format, required),
  recipeId?: ObjectId (ref: Recipe),
  label?: string ("Eating Out", "TBD", custom),
  isConfirmed: boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Unique Compound Index** (CRITICAL):
```typescript
// Ensures one plan per user per date
planSchema.index({ userId: 1, date: 1 }, { unique: true });
```

**Validations**:
- Date must be in YYYY-MM-DD format
- Either recipeId OR label must be provided (not both, not neither)
- userId must be valid ObjectId
- recipeId must be valid ObjectId if provided

**Business Rules**:
- Date stored as STRING, not Date object (avoids timezone issues)
- One plan per user per date (enforced by unique index)
- Plans can reference a recipe OR have a text label
- Confirmed plans trigger `lastUsedDate` update on recipe

### Household Model (`models/household.ts`)

**Status**: Future feature, schema ready but not actively used

```typescript
{
  _id: ObjectId,
  name: string (required),
  createdBy: ObjectId (ref: User, required),
  members: ObjectId[] (refs: User, default: []),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Purpose**:
- Share recipes and plans across multiple users
- Family/roommate meal planning

## Index Strategy

### Why Indexes Matter:
- Fast query performance (especially with user isolation)
- Efficient text search
- Support for common filter operations

### Current Indexes:

**User**:
- `email` (unique) - Login lookups
- `providerId` - OAuth lookups

**Recipe**:
- `userId` - User isolation (ALL queries)
- `{ userId, title: 'text' }` - Search by title
- `{ userId, tags }` - Filter by tags
- `{ userId, lastUsedDate }` - Suggestion algorithm
- `{ userId, complexity }` - Filter by complexity
- `{ userId, isVegetarian }` - Vegetarian filtering

**Plan**:
- `{ userId, date }` (unique) - One plan per date per user
- `userId` - User isolation
- `date` - Date range queries

### Index Monitoring:
```javascript
// Check if indexes are being used
db.recipes.find({ userId: ObjectId('...'), tags: 'dinner' }).explain('executionStats')

// Look for:
// - executionStats.totalDocsExamined (should be low)
// - winningPlan.stage should be 'IXSCAN' not 'COLLSCAN'
```

## Query Patterns

### User Isolation (MANDATORY):
```typescript
// ✅ CORRECT - Always scope by userId
const recipes = await Recipe.find({ userId: req.userId });

// ❌ WRONG - Security vulnerability
const recipes = await Recipe.find({});
```

### Text Search:
```typescript
// Search recipes by title
const recipes = await Recipe.find({
  userId: req.userId,
  $text: { $search: 'pasta chicken' }
}).sort({ score: { $meta: 'textScore' } });
```

### Tag Filtering:
```typescript
// Find recipes with ANY of these tags
const recipes = await Recipe.find({
  userId: req.userId,
  tags: { $in: ['dinner', 'quick'] }
});

// Find recipes with ALL of these tags
const recipes = await Recipe.find({
  userId: req.userId,
  tags: { $all: ['vegetarian', 'quick'] }
});
```

### Date Range Queries:
```typescript
// Get plans for a week
const startDate = '2026-01-11';
const endDate = '2026-01-17';

const plans = await Plan.find({
  userId: req.userId,
  date: { $gte: startDate, $lte: endDate }
}).sort({ date: 1 });
```

### Aggregation (Plan Count):
```typescript
// Get recipes with plan count
const recipes = await Recipe.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  {
    $lookup: {
      from: 'plans',
      localField: '_id',
      foreignField: 'recipeId',
      as: 'plans'
    }
  },
  {
    $addFields: {
      planCount: { $size: '$plans' }
    }
  },
  { $sort: { createdAt: -1 } }
]);
```

### Suggestion Algorithm Queries:
```typescript
// Find recipes not used in last 10 days
const tenDaysAgo = new Date();
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

const recipes = await Recipe.find({
  userId: req.userId,
  $or: [
    { lastUsedDate: { $exists: false } },
    { lastUsedDate: { $lt: tenDaysAgo } }
  ]
});
```

## Data Validation

### Mongoose Schema Validation:
```typescript
const recipeSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty']
  },
  complexity: {
    type: String,
    enum: {
      values: ['simple', 'medium', 'complex'],
      message: '{VALUE} is not a valid complexity'
    }
  },
  prepTime: {
    type: Number,
    min: [0, 'Prep time cannot be negative']
  }
});
```

### Custom Validation:
```typescript
planSchema.pre('save', function(next) {
  // Ensure either recipeId OR label is set, not both
  if (this.recipeId && this.label) {
    next(new Error('Plan cannot have both recipeId and label'));
  }
  if (!this.recipeId && !this.label) {
    next(new Error('Plan must have either recipeId or label'));
  }
  next();
});
```

## Date Handling (CRITICAL)

### Why Strings Instead of Dates:
Plans use YYYY-MM-DD strings instead of Date objects to avoid timezone issues.

**Problem with Date objects**:
```typescript
// User in PST creates plan for "2026-01-11"
// Gets stored as: 2026-01-11T08:00:00.000Z (UTC)
// User in EST queries for "2026-01-11"
// Comparison fails due to timezone conversion
```

**Solution with strings**:
```typescript
// All users see and store "2026-01-11" regardless of timezone
const plan = new Plan({
  userId,
  date: '2026-01-11', // String
  recipeId
});
```

### Date Format Validation:
```typescript
planSchema.pre('save', function(next) {
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(this.date)) {
    next(new Error('Date must be in YYYY-MM-DD format'));
  }
  next();
});
```

## Common Database Operations

### Create:
```typescript
const recipe = new Recipe({
  userId: req.userId,
  title: 'Pasta Carbonara',
  ingredientsText: '...',
  tags: ['dinner', 'italian']
});
await recipe.save();
```

### Read (Single):
```typescript
const recipe = await Recipe.findOne({
  _id: recipeId,
  userId: req.userId // ALWAYS include for security
});

if (!recipe) {
  return res.status(404).json({ message: 'Recipe not found' });
}
```

### Read (Multiple):
```typescript
const recipes = await Recipe.find({ userId: req.userId })
  .sort({ createdAt: -1 })
  .limit(20)
  .select('-__v'); // Exclude version field
```

### Update:
```typescript
const recipe = await Recipe.findOneAndUpdate(
  { _id: recipeId, userId: req.userId },
  { $set: { title: 'New Title' } },
  { new: true, runValidators: true }
);
```

### Delete:
```typescript
const recipe = await Recipe.findOneAndDelete({
  _id: recipeId,
  userId: req.userId
});

if (!recipe) {
  return res.status(404).json({ message: 'Recipe not found' });
}
```

### Upsert (Update or Create):
```typescript
// Create or update plan for a specific date
const plan = await Plan.findOneAndUpdate(
  { userId: req.userId, date: '2026-01-11' },
  { $set: { recipeId, isConfirmed: true } },
  { upsert: true, new: true }
);
```

## Population (Joins)

### Basic Population:
```typescript
// Get plan with full recipe details
const plan = await Plan.findOne({ userId, date })
  .populate('recipeId');

// Returns:
// {
//   _id: '...',
//   date: '2026-01-11',
//   recipeId: { _id: '...', title: 'Pasta', ... }, // Full recipe object
//   isConfirmed: true
// }
```

### Selective Population:
```typescript
const plan = await Plan.findOne({ userId, date })
  .populate('recipeId', 'title imageUrl complexity cookTime');
// Only include specified fields
```

### Multiple Populations:
```typescript
const plans = await Plan.find({ userId, date: { $gte: startDate } })
  .populate('recipeId')
  .populate('userId', 'name email');
```

## Transaction Support (Future)

MongoDB Atlas supports multi-document transactions if needed:

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  const recipe = await Recipe.create([{ ... }], { session });
  const plan = await Plan.create([{ ... }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## Data Migration & Seeding

### Seed Script Example (`scripts/seedData.ts`):
```typescript
import User from './models/user';
import Recipe from './models/recipe';

const seedDatabase = async () => {
  // Create test user
  const user = await User.create({
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: await bcrypt.hash('password', 10),
    authProvider: 'local'
  });

  // Create test recipes
  await Recipe.create([
    {
      userId: user._id,
      title: 'Spaghetti Carbonara',
      tags: ['italian', 'dinner'],
      complexity: 'medium'
    },
    // ... more recipes
  ]);

  console.log('Database seeded!');
};
```

## Performance Optimization

### Query Optimization:
- Always use indexes for common queries
- Use `.select()` to exclude unnecessary fields
- Use `.lean()` for read-only data (faster, plain objects)
- Use aggregation pipeline for complex computations

### Example:
```typescript
// Faster read-only query
const recipes = await Recipe.find({ userId })
  .select('title imageUrl complexity')
  .lean() // Returns plain JS objects, not Mongoose documents
  .limit(50);
```

### Connection Pooling:
Mongoose handles connection pooling automatically. Default pool size is 5.

```typescript
mongoose.connect(uri, {
  maxPoolSize: 10, // Adjust based on load
  minPoolSize: 2
});
```

## Common Pitfalls

❌ Don't forget user isolation
✅ Always include `userId` in queries

❌ Don't use Date objects for plan dates
✅ Use YYYY-MM-DD string format

❌ Don't forget to await database operations
✅ Always await or use callbacks

❌ Don't expose MongoDB ObjectIds externally
✅ They're fine - MongoDB uses them as _id

❌ Don't query without indexes
✅ Add indexes for commonly queried fields

❌ Don't forget to populate references
✅ Use `.populate()` when you need related data

❌ Don't manually set _id, createdAt, updatedAt
✅ Let Mongoose auto-generate them

## Backup & Recovery

### MongoDB Atlas Features:
- Automatic daily backups (retention based on tier)
- Point-in-time recovery
- Download snapshots for local testing

### Manual Backup:
```bash
mongodump --uri="mongodb+srv://..." --out=./backup
```

### Restore:
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

## Monitoring

### Useful Queries for Debugging:

```javascript
// Check current indexes
db.recipes.getIndexes()

// Get collection stats
db.recipes.stats()

// Find slow queries (enable profiling)
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)
```

### Mongoose Debug Mode:
```typescript
mongoose.set('debug', true); // Logs all queries to console
```

## Security Considerations

✅ User isolation on ALL queries
✅ Unique indexes prevent duplicates
✅ Validation prevents invalid data
✅ No raw query strings (prevents injection)
✅ Mongoose sanitizes input automatically
✅ Connection string in environment variables

⚠️ Consider: Rate limiting on write operations
⚠️ Consider: Soft deletes vs hard deletes (data retention)
