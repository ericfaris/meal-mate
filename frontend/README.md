# Meal Mate Frontend

React Native mobile app built with Expo for planning weekly meals.

## Features

- Browse and manage recipes
- Plan meals for the week
- Bottom tab navigation
- Real-time updates via REST API
- TypeScript for type safety

## Setup

1. Install dependencies:
```bash
npm install
```

2. Get your computer's local IP:
   - **Windows**: Run `ipconfig`
   - **Mac/Linux**: Run `ifconfig`
   - Find your WiFi adapter's IPv4 address

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your local IP to `.env`:
```
API_BASE_URL=http://192.168.1.XXX:3001
```

5. Start Expo:
```bash
npm start
```

6. Scan QR code with Expo Go app on your phone

## Scripts

- `npm start` - Start Expo development server
- `npm run android` - Open on Android emulator
- `npm run ios` - Open on iOS simulator
- `npm run web` - Open in web browser

## Project Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── api.ts          # API configuration
│   ├── navigation/
│   │   └── BottomTabNavigator.tsx
│   ├── screens/
│   │   ├── RecipesScreen.tsx
│   │   ├── PlannerScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   └── api/
│   │       ├── recipes.ts  # Recipe API client
│   │       ├── plans.ts    # Plans API client
│   │       └── index.ts
│   └── types/
│       └── index.ts        # TypeScript types
├── App.tsx                 # App entry point
├── app.json                # Expo configuration
├── .env                    # Environment variables
└── package.json
```

## Troubleshooting

### Can't connect to backend

1. Verify backend is running on port 3001
2. Check your local IP in `.env` matches `ipconfig`/`ifconfig`
3. Ensure phone and computer are on same WiFi network
4. Try temporarily disabling firewall

### App won't reload

Shake your phone and press "Reload" in the Expo menu.
