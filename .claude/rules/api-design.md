---
paths:
  - "backend/src/routes/**/*.ts"
  - "backend/src/controllers/**/*.ts"
  - "frontend/src/services/api/**/*.ts"
---

# API Design Patterns & Conventions

## API Architecture

### Base URL:
- Development: `http://localhost:3000`
- Production: TBD (will be deployed URL)

### Authentication:
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

## RESTful Endpoint Structure

### Resource Naming:
- Use plural nouns for collections: `/recipes`, `/plans`, `/users`
- Use kebab-case for multi-word resources: `/recipe-import`
- Use URL parameters for single resource access: `/recipes/:id`
- Use query parameters for filtering: `/recipes?search=pasta&tags=dinner`

### HTTP Methods:
```
GET     - Retrieve resource(s)
POST    - Create new resource
PUT     - Update/replace entire resource
PATCH   - Update partial resource (if needed)
DELETE  - Remove resource
```

## API Endpoints Reference

### Authentication Endpoints (`/api/auth`)

#### Register New User
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "authProvider": "local",
    "emailVerified": false
  }
}

Error (400):
{
  "message": "Email already exists"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

Error (401):
{
  "message": "Invalid email or password"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "profilePicture": "https://...",
  "authProvider": "google"
}

Error (401):
{
  "message": "Authentication required"
}
```

#### Google OAuth
```
POST /api/auth/google
Content-Type: application/json

Request Body:
{
  "idToken": "google-id-token-from-frontend"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Recipe Endpoints (`/api/recipes`)

#### List Recipes
```
GET /api/recipes?search=pasta&tags=dinner,quick
Authorization: Bearer <token>

Query Parameters:
- search (optional): Text search in title
- tags (optional): Comma-separated list of tags

Response (200):
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "title": "Spaghetti Carbonara",
    "imageUrl": "https://...",
    "ingredientsText": "...",
    "directionsText": "...",
    "tags": ["italian", "dinner"],
    "complexity": "medium",
    "isVegetarian": false,
    "prepTime": 10,
    "cookTime": 20,
    "servings": 4,
    "planCount": 3,
    "lastUsedDate": "2026-01-05T00:00:00.000Z",
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2026-01-05T15:30:00.000Z"
  }
]
```

#### Get Single Recipe
```
GET /api/recipes/:id
Authorization: Bearer <token>

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Spaghetti Carbonara",
  ...
}

Error (404):
{
  "message": "Recipe not found"
}
```

#### Create Recipe
```
POST /api/recipes
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "title": "Spaghetti Carbonara",
  "imageUrl": "https://...",
  "ingredientsText": "500g spaghetti\n200g pancetta\n...",
  "directionsText": "1. Boil water\n2. Cook pasta\n...",
  "tags": ["italian", "dinner"],
  "complexity": "medium",
  "isVegetarian": false,
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "notes": "Family favorite!"
}

Required Fields: title
Optional Fields: all others

Response (201):
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "title": "Spaghetti Carbonara",
  ...
}

Error (400):
{
  "message": "Title is required"
}
```

#### Update Recipe
```
PUT /api/recipes/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "title": "Updated Title",
  "tags": ["italian", "pasta", "dinner"]
}

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Updated Title",
  ...
}

Error (404):
{
  "message": "Recipe not found"
}
```

#### Delete Recipe
```
DELETE /api/recipes/:id
Authorization: Bearer <token>

Response (204):
No content

Error (404):
{
  "message": "Recipe not found"
}
```

#### Import Recipe from URL
```
POST /api/recipes/import
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "url": "https://www.allrecipes.com/recipe/12345/spaghetti-carbonara/"
}

Response (201):
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Spaghetti Carbonara",
  "sourceUrl": "https://www.allrecipes.com/...",
  "ingredientsText": "...",
  "directionsText": "...",
  "imageUrl": "...",
  ...
}

Error (400):
{
  "message": "Failed to import recipe from this URL"
}
```

#### Import Recipe from Photo (Admin-only)
```
POST /api/recipes/import-photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body:
- image: File (JPEG, PNG, GIF, WebP)

Response (200):
{
  "title": "Chocolate Chip Cookies",
  "ingredientsText": "2 cups flour\n1 cup sugar\n...",
  "directionsText": "1. Preheat oven to 350°F\n2. Mix dry ingredients\n...",
  "prepTime": 15,
  "cookTime": 12,
  "servings": 24,
  "tags": ["dessert", "baking", "cookies"]
}

Error (403):
{
  "error": "Only household admins can import recipes"
}

Error (400):
{
  "error": "No image file provided"
}

Error (500):
{
  "error": "AI service is not configured"
}

Note: Requires ANTHROPIC_API_KEY environment variable
Note: Admin role check enforced to prevent API quota abuse
Note: Response is for manual review - user must save manually
```


### Plan Endpoints (`/api/plans`)

#### Get Plans for Date Range
```
GET /api/plans?start=2026-01-11&days=7
Authorization: Bearer <token>

Query Parameters:
- start (required): Start date (YYYY-MM-DD)
- days (optional): Number of days (default: 7)

Response (200):
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f191e810c19729de860ea",
    "date": "2026-01-11",
    "recipeId": {
      "_id": "507f191e810c19729de860eb",
      "title": "Spaghetti Carbonara",
      "imageUrl": "...",
      "complexity": "medium",
      "cookTime": 20
    },
    "isConfirmed": true,
    "createdAt": "2026-01-01T10:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "date": "2026-01-12",
    "label": "Eating Out",
    "isConfirmed": true
  }
]

Note: recipeId is populated with full recipe object
```

#### Get Plan for Specific Date
```
GET /api/plans/:date
Authorization: Bearer <token>

URL Parameter:
- date: YYYY-MM-DD format

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "date": "2026-01-11",
  "recipeId": { ... },
  "isConfirmed": true
}

Response (404):
{
  "message": "No plan found for this date"
}
```

#### Create/Update Plan
```
PUT /api/plans/:date
Authorization: Bearer <token>
Content-Type: application/json

Request Body (Recipe-based):
{
  "recipeId": "507f191e810c19729de860eb",
  "isConfirmed": true
}

Request Body (Label-based):
{
  "label": "Eating Out",
  "isConfirmed": true
}

Note: Provide either recipeId OR label, not both

Response (200):
{
  "_id": "507f1f77bcf86cd799439011",
  "date": "2026-01-11",
  "recipeId": "507f191e810c19729de860eb",
  "isConfirmed": true
}

Error (400):
{
  "message": "Provide either recipeId or label, not both"
}
```

#### Delete Plan
```
DELETE /api/plans/:date
Authorization: Bearer <token>

Response (204):
No content

Error (404):
{
  "message": "No plan found for this date"
}
```

#### Delete All Plans
```
DELETE /api/plans
Authorization: Bearer <token>

Response (200):
{
  "message": "All plans deleted",
  "deletedCount": 15
}
```

### Suggestion Endpoints (`/api/suggestions`)

#### Generate Week of Suggestions
```
POST /api/suggestions/generate
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "startDate": "2026-01-11",
  "daysToSkip": [5, 6],
  "avoidRepeats": true,
  "preferSimple": false,
  "vegetarianOnly": false
}

Response (200):
[
  {
    "date": "2026-01-11",
    "recipe": {
      "_id": "507f191e810c19729de860eb",
      "title": "Spaghetti Carbonara",
      "imageUrl": "...",
      "complexity": "medium",
      "cookTime": 20
    }
  },
  {
    "date": "2026-01-12",
    "recipe": { ... }
  },
  {
    "date": "2026-01-16",
    "recipe": null,
    "skipped": true
  }
]

Note: Returns 7 suggestions (one per day)
Days in daysToSkip array have recipe: null, skipped: true
```

#### Get Alternative Suggestion
```
POST /api/suggestions/alternative
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "date": "2026-01-11",
  "excludeRecipeIds": ["507f191e810c19729de860eb"],
  "avoidRepeats": true,
  "preferSimple": false,
  "vegetarianOnly": false
}

Response (200):
{
  "date": "2026-01-11",
  "recipe": {
    "_id": "507f191e810c19729de860ec",
    "title": "Chicken Stir Fry",
    ...
  }
}

Error (404):
{
  "message": "No alternative suggestions available"
}
```

#### Approve Suggestions (Save as Plans)
```
POST /api/suggestions/approve
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
[
  {
    "date": "2026-01-11",
    "recipeId": "507f191e810c19729de860eb"
  },
  {
    "date": "2026-01-12",
    "recipeId": "507f191e810c19729de860ec"
  }
]

Response (201):
{
  "message": "Plans created successfully",
  "plans": [
    {
      "_id": "...",
      "date": "2026-01-11",
      "recipeId": "507f191e810c19729de860eb",
      "isConfirmed": true
    },
    ...
  ]
}
```

### Utility Endpoints

#### Image Search
```
GET /api/images/search?query=pasta%20carbonara
Authorization: Bearer <token>

Query Parameters:
- query (required): Search term for images

Response (200):
{
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

#### Health Check
```
GET /health
No authentication required

Response (200):
{
  "status": "ok",
  "timestamp": "2026-01-11T10:00:00.000Z"
}
```

## Response Standards

### Success Responses:
- `200 OK` - Successful GET, PUT
- `201 Created` - Successful POST (new resource)
- `204 No Content` - Successful DELETE

### Error Responses:
- `400 Bad Request` - Validation errors, invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Valid token, insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server-side errors

### Error Response Format:
```json
{
  "message": "Human-readable error message"
}
```

## Request/Response Patterns

### Pagination (Future):
For endpoints that return large lists, consider:
```
GET /api/recipes?page=2&limit=20

Response:
{
  "data": [ ... ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Filtering:
- Use query parameters for filters
- Support multiple filters simultaneously
- Use comma-separated values for array filters

Examples:
```
GET /api/recipes?tags=dinner,quick&isVegetarian=true&complexity=simple
```

### Sorting (Future):
```
GET /api/recipes?sort=-createdAt,title
# Sort by createdAt descending, then title ascending
```

## Frontend API Service Pattern

### Service Module Structure:
```typescript
// frontend/src/services/api/recipes.ts
import api from './index'; // Axios instance with auth interceptor

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

  update: async (id: string, updates: Partial<RecipeInput>) => {
    const response = await api.put(`/recipes/${id}`, updates);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/recipes/${id}`);
  },

  importFromUrl: async (url: string) => {
    const response = await api.post('/recipes/import', { url });
    return response.data;
  }
};
```

### Axios Instance Configuration:
```typescript
// frontend/src/services/api/index.ts
import axios from 'axios';
import * as storage from '../storage';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      storage.removeToken();
      // Navigate to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

## API Versioning (Future)

If API changes require versioning:
```
/api/v1/recipes
/api/v2/recipes
```

For now, no versioning is needed.

## Rate Limiting (Future)

Consider implementing:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## CORS Configuration

Development:
```typescript
app.use(cors({
  origin: 'http://localhost:19006', // Expo dev server
  credentials: true
}));
```

Production:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## API Testing

### Manual Testing Tools:
- Postman
- Thunder Client (VS Code extension)
- curl commands

### Example curl:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get recipes with token
curl http://localhost:3000/api/recipes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Best Practices

### API Design:
✅ Use RESTful conventions
✅ Use appropriate HTTP methods
✅ Return proper status codes
✅ Provide clear error messages
✅ Validate all input
✅ Document all endpoints

### Security:
✅ Require authentication on protected routes
✅ Validate user ownership of resources
✅ Sanitize user input
✅ Use HTTPS in production
✅ Implement rate limiting (future)

### Performance:
✅ Use database indexes
✅ Implement caching where appropriate (future)
✅ Paginate large result sets (future)
✅ Use compression (gzip)
✅ Minimize response payload size

### Developer Experience:
✅ Consistent response formats
✅ Clear error messages
✅ Type definitions for requests/responses
✅ API documentation
✅ Health check endpoint
