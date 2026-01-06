# Meal Mate - Dinner Planner App

A React Native mobile app for planning weekly meals with a Node.js backend and MongoDB Atlas database.

## Project Structure

```
meal-mate/
├── backend/          # Node.js + Express API server
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── models/   # Mongoose schemas
│   │   ├── routes/   # API routes
│   │   ├── controllers/ # Route handlers
│   │   ├── app.ts    # Express app setup
│   │   └── server.ts # Server entry point
│   └── package.json
│
└── frontend/         # React Native + Expo app
    ├── src/
    │   ├── config/   # API configuration
    │   ├── navigation/ # React Navigation
    │   ├── screens/  # App screens
    │   ├── services/ # API client
    │   └── types/    # TypeScript types
    ├── App.tsx
    └── package.json
```

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type safety
- **MongoDB Atlas** - Cloud NoSQL database
- **Mongoose** - MongoDB ODM

### Frontend
- **React Native** + **Expo** - Mobile framework
- **TypeScript** - Type safety
- **React Navigation** - Navigation with bottom tabs
- **Axios** - HTTP client
- **React Native Reanimated** - Animations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier)
- Expo Go app on your phone
- WiFi network (phone and computer on same network)

### Setup Instructions

#### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your MongoDB connection string
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meal-mate?retryWrites=true&w=majority
# PORT=3001

# Start development server (with auto-reload)
npm run dev
```

The backend will run on `http://localhost:3001`

#### 3. Frontend Setup

First, get your local IP address:
- **Windows**: Run `ipconfig` and find your WiFi adapter's IPv4 address
- **Mac/Linux**: Run `ifconfig` and find your WiFi interface's IP

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your local IP address
# API_BASE_URL=http://192.168.1.XXX:3001
# (Replace XXX with your actual IP address)

# Start Expo development server
npm start
```

#### 4. Run on Your Phone

1. Install **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in terminal
3. The app will connect to your local backend via WiFi

## Development Workflow

### Terminal 1 - Backend
```bash
cd backend
npm run dev  # Auto-restarts on file changes
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start    # Hot reload on phone
```

### Your Iteration Loop

1. Edit React Native code → Instant reload on phone
2. Edit backend code → nodemon auto-restarts in 2s
3. Both changes visible instantly

## API Endpoints

### Recipes
- `GET /api/recipes` - List all recipes (supports `?search=query&tags=tag1,tag2`)
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Plans
- `GET /api/plans?start=YYYY-MM-DD&days=7` - Get plans for date range
- `GET /api/plans/:date` - Get plan for specific date
- `PUT /api/plans/:date` - Update/create plan for date
- `DELETE /api/plans/:date` - Delete plan

### Health Check
- `GET /health` - Check server status

## Database Schema

### Recipes Collection
```typescript
{
  _id: ObjectId,
  title: string,          // required
  imageUrl: string,
  sourceUrl: string,
  ingredientsText: string, // required
  directionsText: string,  // required
  notes: string,
  tags: string[],         // ["Quick", "Chicken", "SheetPan"]
  createdAt: Date,
  updatedAt: Date
}
```

### Plans Collection
```typescript
{
  _id: ObjectId,
  date: string,           // "2026-01-05" (YYYY-MM-DD)
  recipeId: ObjectId,     // ref to recipes._id
  label: string,          // "Eat out", "Leftovers"
  isConfirmed: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Common Issues

### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB Atlas allows your IP address
- Verify database user credentials

### Frontend can't connect to backend
- Verify your local IP in `frontend/.env`
- Ensure phone and computer are on same WiFi
- Check backend is running on port 3001
- Try disabling firewall temporarily

### Changes not appearing
- Backend: Check if nodemon is watching files
- Frontend: Shake phone and press "Reload" in Expo

## Future Features

- [ ] User authentication
- [ ] AI-powered meal suggestions
- [ ] Grocery list generation
- [ ] Recipe import from URLs
- [ ] EAS Build for App Store deployment
- [ ] Push notifications

## License

ISC