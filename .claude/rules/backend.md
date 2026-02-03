---
paths:
  - "backend/**/*.ts"
  - "backend/**/*.js"
---

# Backend Development Rules (Node.js/Express)

## Tech Stack
- **Node.js** + **Express** for REST API
- **TypeScript** for type safety
- **MongoDB Atlas** cloud database
- **Mongoose** ODM for schema modeling
- **JWT** for authentication
- **bcryptjs** for password hashing

## Project Structure

```
backend/src/
├── server.ts                       # Entry point
├── app.ts                          # Express app configuration
├── config/
│   ├── db.ts                      # MongoDB connection
│   └── oauth.ts                   # OAuth configuration
├── models/                         # Mongoose schemas
│   ├── user.ts
│   ├── recipe.ts
│   ├── plan.ts
│   └── household.ts
├── controllers/                    # Request handlers
│   ├── auth.ts
│   ├── recipes.ts
│   ├── plans.ts
│   ├── suggestions.ts
│   ├── recipeImport.ts
│   └── imageSearch.ts
├── routes/                         # API endpoint definitions
│   ├── auth.ts
│   ├── recipes.ts
│   ├── plans.ts
│   └── suggestions.ts
├── middleware/
│   └── auth.ts                    # JWT verification
└── services/
    ├── suggestionService.ts       # Meal suggestion algorithm
    └── recipeParser.ts            # HTML parsing for recipe import
```

## Architecture Patterns

### MVC-Style Separation:
- **Routes**: Define endpoints and HTTP methods
- **Controllers**: Handle request/response logic
- **Services**: Contain business logic
- **Models**: Define data schemas and database interaction

### User Isolation:
- ALL data queries MUST be scoped by `userId`
- Never allow cross-user data access
- JWT middleware attaches `userId` to `req.userId`

## Request Handling Pattern

### Standard Controller Pattern:
```typescript
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const { search, tags } = req.query;

    // Build query with user isolation
    const query: any = { userId };
    if (search) {
      query.$text = { $search: search as string };
    }
    if (tags) {
      query.tags = { $in: (tags as string).split(',') };
    }

    const recipes = await Recipe.find(query).sort({ createdAt: -1 });

    res.json(recipes);
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
};
```

### Error Handling:
- Always wrap async operations in try-catch
- Return appropriate HTTP status codes
- Provide user-friendly error messages
- Log errors for debugging (but don't expose sensitive info)

### Status Codes:
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (valid token, insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Authentication & Authorization

### JWT Middleware (`middleware/auth.ts`):
```typescript
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### Protected Routes:
```typescript
// Apply to all routes that need authentication
router.get('/recipes', authenticateToken, getRecipes);
router.post('/recipes', authenticateToken, createRecipe);
```

### Password Hashing:
```typescript
import bcrypt from 'bcryptjs';

// Hash password on registration
const passwordHash = await bcrypt.hash(password, 10);

// Verify password on login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### JWT Token Generation:
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
);
```

## Mongoose Schema Patterns

### User Isolation with Indexes:
```typescript
const recipeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // IMPORTANT: Index for query performance
  },
  title: { type: String, required: true },
  // ... other fields
});

// Compound indexes for common queries
recipeSchema.index({ userId: 1, title: 'text' }); // Text search
recipeSchema.index({ userId: 1, tags: 1 }); // Tag filtering
recipeSchema.index({ userId: 1, lastUsedDate: 1 }); // Suggestion algorithm
```

### Unique Constraints:
```typescript
// Ensure one plan per user per date
planSchema.index({ userId: 1, date: 1 }, { unique: true });
```

### Virtuals & Methods:
```typescript
// Virtual fields (computed, not stored)
recipeSchema.virtual('totalTime').get(function() {
  return (this.prepTime || 0) + (this.cookTime || 0);
});

// Instance methods
recipeSchema.methods.updateLastUsed = async function(date: string) {
  this.lastUsedDate = new Date(date);
  await this.save();
};

// Static methods
recipeSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId });
};
```

## Critical Business Logic

### Suggestion Algorithm (`services/suggestionService.ts`)

**Purpose**: Generate intelligent weekly meal suggestions based on constraints

**Key Functions**:

#### `generateWeekSuggestions(constraints, userId)`
```typescript
export const generateWeekSuggestions = async (
  constraints: {
    startDate: string;
    daysToSkip: number[];
    avoidRepeats: boolean;
    preferSimple: boolean;
    vegetarianOnly: boolean;
  },
  userId: string
) => {
  // 1. Build query filter
  const filter: any = { userId };

  if (constraints.vegetarianOnly) {
    filter.isVegetarian = true;
  }

  if (constraints.avoidRepeats) {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    filter.$or = [
      { lastUsedDate: { $exists: false } },
      { lastUsedDate: { $lt: tenDaysAgo } }
    ];
  }

  // 2. Fetch recipes
  let recipes = await Recipe.find(filter);

  // 3. Sort by complexity preference
  if (constraints.preferSimple) {
    recipes = recipes.sort((a, b) => {
      const complexityOrder = { simple: 0, medium: 1, complex: 2 };
      return (complexityOrder[a.complexity] || 1) - (complexityOrder[b.complexity] || 1);
    });
  }

  // 4. Shuffle for variety
  recipes = shuffleArray(recipes);

  // 5. Generate 7-day suggestions
  const suggestions = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(constraints.startDate, i);

    if (constraints.daysToSkip.includes(i)) {
      suggestions.push({ date, recipe: null, skipped: true });
    } else {
      suggestions.push({ date, recipe: recipes[i % recipes.length] || null });
    }
  }

  return suggestions;
};
```

**Important Notes**:
- 10-day lookback window for "avoid repeats"
- Complexity sorting: simple → medium → complex
- Shuffle ensures variety
- Falls back gracefully if not enough recipes

#### `markRecipeAsUsed(recipeId, date)`
```typescript
export const markRecipeAsUsed = async (recipeId: string, date: string) => {
  await Recipe.findByIdAndUpdate(recipeId, {
    lastUsedDate: new Date(date)
  });
};
```

**Called when**: User confirms a plan with a recipe

### Recipe Import (`controllers/recipeImport.ts`, `controllers/recipePhotoImport.ts`)

**URL Import Strategy**:
1. Try `recipe-scraper` library (primary method)
2. Fall back to custom Cheerio parser
3. **HTML entity decoding** for all text fields (titles, ingredients, directions, notes)
4. Validate and sanitize all data
5. **No auto-assigned complexity** - user sets manually if desired

**HTML Entity Decoding**:

All imported recipe text fields are decoded to handle special characters:

- Common entities: `&#39;` → `'`, `&quot;` → `"`, `&amp;` → `&`
- Smart quotes: `&#8217;` → `'`, `&ldquo;` → `"`
- Special chars: `&ndash;` → `–`, `&hellip;` → `…`

This ensures recipes display correctly regardless of source encoding.

**Photo Import** (Admin-only):
```typescript
// POST /api/recipes/import-photo
// Requires: multipart/form-data with image file
// Admin role check enforced

1. Validate user is admin (prevents API quota abuse)
2. Accept image upload (JPEG, PNG, GIF, WebP)
3. Convert to base64 and send to Claude Vision API
4. Extract recipe data from image using structured prompt
5. Return JSON for manual review before saving
```

**Claude Vision Integration**:
- Model: `claude-sonnet-4-20250514`
- Extracts: title, ingredients, directions, prep/cook time, servings, tags
- Requires `ANTHROPIC_API_KEY` environment variable
- Returns structured JSON or error message if not a recipe
- Frontend displays extracted data for user confirmation before save

## Database Queries

### Always Scope by User:
```typescript
// ❌ WRONG - Security vulnerability
const recipe = await Recipe.findById(recipeId);

// ✅ CORRECT - User-scoped
const recipe = await Recipe.findOne({ _id: recipeId, userId: req.userId });
```

### Efficient Queries:
```typescript
// Use indexes for performance
const recipes = await Recipe.find({ userId, tags: 'dinner' })
  .sort({ createdAt: -1 })
  .limit(20)
  .select('-__v'); // Exclude version field

// Aggregation for computed fields
const recipesWithPlanCount = await Recipe.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  { $lookup: {
      from: 'plans',
      localField: '_id',
      foreignField: 'recipeId',
      as: 'plans'
  }},
  { $addFields: { planCount: { $size: '$plans' } } }
]);
```

### Date Handling:
```typescript
// CRITICAL: Dates stored as YYYY-MM-DD strings in Plan model
// NOT as Date objects to avoid timezone issues

const plan = await Plan.findOne({
  userId: req.userId,
  date: '2026-01-11' // String, not Date
});
```

## API Endpoint Design

### RESTful Conventions:
```
GET    /api/resource          - List all (with user scope)
GET    /api/resource/:id      - Get single
POST   /api/resource          - Create new
PUT    /api/resource/:id      - Update existing
DELETE /api/resource/:id      - Delete
```

### Query Parameters:
```typescript
// GET /api/recipes?search=pasta&tags=dinner,quick
const { search, tags } = req.query;

// Validate and parse
if (tags && typeof tags === 'string') {
  const tagArray = tags.split(',').map(t => t.trim());
}
```

### Request Body Validation:
```typescript
const createRecipe = async (req: Request, res: Response) => {
  const { title, ingredientsText, directionsText } = req.body;

  // Validate required fields
  if (!title?.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  // Create recipe
  const recipe = new Recipe({
    userId: req.userId,
    title: title.trim(),
    ingredientsText: ingredientsText?.trim() || '',
    directionsText: directionsText?.trim() || '',
  });

  await recipe.save();
  res.status(201).json(recipe);
};
```

## Environment Variables

### Required Variables (.env):
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
PORT=3000
NODE_ENV=development
```

### Access in Code:
```typescript
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI!;
const jwtSecret = process.env.JWT_SECRET!;
```

## Error Handling Best Practices

### Validation Errors (400):
```typescript
if (!title) {
  return res.status(400).json({ message: 'Title is required' });
}
```

### Not Found (404):
```typescript
const recipe = await Recipe.findOne({ _id: id, userId });
if (!recipe) {
  return res.status(404).json({ message: 'Recipe not found' });
}
```

### Server Errors (500):
```typescript
try {
  // ... operation
} catch (error: any) {
  console.error('Error creating recipe:', error);
  res.status(500).json({ message: 'Failed to create recipe' });
}
```

### Mongoose Errors:
```typescript
catch (error: any) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) { // Duplicate key
    return res.status(400).json({ message: 'Resource already exists' });
  }
  res.status(500).json({ message: 'Internal server error' });
}
```

## OAuth Integration

### Google OAuth Flow:
```typescript
// 1. Frontend sends Google ID token
POST /api/auth/google
Body: { idToken: 'xxx' }

// 2. Backend validates with Google
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ticket = await client.verifyIdToken({
  idToken,
  audience: process.env.GOOGLE_CLIENT_ID,
});

const payload = ticket.getPayload();
const { sub: googleId, email, name, picture } = payload;

// 3. Find or create user
let user = await User.findOne({ providerId: googleId, authProvider: 'google' });
if (!user) {
  user = await User.create({
    email,
    name,
    profilePicture: picture,
    authProvider: 'google',
    providerId: googleId,
    emailVerified: true,
  });
}

// 4. Generate JWT
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
res.json({ token, user });
```

## Common Pitfalls to Avoid

❌ Don't forget user isolation on queries
✅ Always include `userId` in queries

❌ Don't expose sensitive data in responses
✅ Exclude `passwordHash`, `__v`, sensitive tokens

❌ Don't trust client input
✅ Validate and sanitize all input

❌ Don't use Date objects for plan dates
✅ Use YYYY-MM-DD string format

❌ Don't hardcode secrets
✅ Use environment variables

❌ Don't forget to await async operations
✅ Always await database calls

❌ Don't return 500 for validation errors
✅ Return 400 with clear message

## Development Commands

```bash
npm run dev          # Start with nodemon (auto-reload)
npm run build        # TypeScript compilation
npm start            # Production mode
npm run seed         # Seed database with sample data
```

## Testing Considerations

### Manual Testing:
- Test all endpoints with Postman/Thunder Client
- Test with valid and invalid JWT tokens
- Test with missing/malformed request bodies
- Test cross-user access (should fail)
- Test edge cases (empty arrays, null values)

### Database Testing:
- Test unique constraints
- Test indexes are working (use `.explain()`)
- Test cascade deletes (if applicable)

## Security Checklist

✅ JWT tokens expire (7 days default)
✅ Passwords hashed with bcrypt (10 rounds)
✅ User isolation on ALL queries
✅ Input validation on ALL endpoints
✅ CORS configured properly
✅ Environment variables for secrets
✅ Error messages don't expose sensitive info
✅ Rate limiting (TODO: implement on auth endpoints)

## Monitoring & Logging

### Development Logging:
```typescript
console.log('User authenticated:', req.userId);
console.error('Database error:', error);
```

### Production Logging:
Consider adding:
- Request logging middleware
- Error tracking (Sentry, etc.)
- Performance monitoring
- Database query logging

## Code Style

### Naming Conventions:
- Controllers: `getRecipes`, `createRecipe` (camelCase)
- Models: `Recipe`, `User` (PascalCase)
- Routes: kebab-case in URLs (`/recipe-import`)
- Constants: `JWT_SECRET` (UPPER_SNAKE_CASE)

### Import Order:
1. Node.js built-ins
2. Third-party packages
3. Local modules (models, services)
4. Types
5. Configs

### File Structure:
```typescript
// 1. Imports
import { Request, Response } from 'express';
import Recipe from '../models/recipe';

// 2. Types/Interfaces
interface RecipeInput { ... }

// 3. Helper functions
const validateRecipe = (data: any) => { ... };

// 4. Exported controller functions
export const getRecipes = async (req, res) => { ... };
export const createRecipe = async (req, res) => { ... };
```
