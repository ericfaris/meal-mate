# Meal Mate Backend

Node.js + Express REST API server for the Meal Mate dinner planner app.

## Features

- RESTful API endpoints for recipes and meal plans
- MongoDB Atlas integration with Mongoose ODM
- TypeScript for type safety
- Auto-reload with nodemon
- CORS enabled for mobile app access

## Setup

1. Install dependencies:

```bash
npm install
```

1. Create `.env` file:

```bash
cp .env.example .env
```

1. Add your MongoDB Atlas connection string to `.env`:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meal-mate?retryWrites=true&w=majority
PORT=3001
```

1. Start development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

## API Documentation

See main README.md for complete API documentation.

## Project Structure

```ascii
backend/
├── src/
│   ├── config/
│   │   └── db.ts           # MongoDB connection
│   ├── models/
│   │   ├── recipe.ts       # Recipe schema
│   │   └── plan.ts         # Plan schema
│   ├── routes/
│   │   ├── recipes.ts      # Recipe routes
│   │   └── plans.ts        # Plan routes
│   ├── controllers/
│   │   ├── recipes.ts      # Recipe handlers
│   │   └── plans.ts        # Plan handlers
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── .env                    # Environment variables
├── .env.example            # Example env file
├── tsconfig.json           # TypeScript config
└── package.json
```
