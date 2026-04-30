# WeatherNow — Frontend

A real-time weather app built with React, Vite, TypeScript, Tailwind CSS, and shadcn/ui. Displays current conditions for any city worldwide via a proxied OpenWeatherMap API, with an AI-powered floating chat assistant.

## Features

- Live weather search with city autocomplete
- Hero card: temperature, condition, high/low, feels like, wind, humidity
- Daylight progress bar with sunrise/sunset times
- Conditions grid: wind speed & direction, wind gust, humidity, pressure, visibility, feels like, cloud cover, rainfall
- Floating AI chat assistant — auto-generates a weather summary, activity recommendations, and best outdoor time; supports follow-up questions (e.g. "Can I go for a run?")
- °C / °F unit toggle with automatic re-fetch
- Recent searches (last 6)
- Popular city shortcuts on the empty state
- Loading skeleton while fetching
- Sticky navbar and footer
- Fully responsive layout (mobile full-screen chat, desktop floating panel)

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev) — build tool
- [Tailwind CSS v3](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) — Card, Button, Input, Badge, Skeleton, Tooltip, Separator
- [lucide-react](https://lucide.dev) — icons
- [Axios](https://axios-http.com) — HTTP client

## Getting Started

### Prerequisites

- Node.js 18+
- The [weather-server](../weather-server) running locally or deployed

### Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in this directory:

```
VITE_API_URL=http://localhost:5000
```

For production, set `VITE_API_URL` to your deployed server URL (e.g. `https://your-weather-server.vercel.app`).

## Project Structure

```
src/
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── Navbar.tsx           # Sticky nav with search and unit toggle
│   ├── HeroWeather.tsx      # Main weather card
│   ├── WeatherDetails.tsx   # Daylight bar + conditions grid
│   ├── WeatherChat.tsx      # Floating AI chat assistant
│   ├── RecentSearches.tsx   # Recent search chips
│   ├── EmptyState.tsx       # Welcome screen with popular cities
│   ├── LoadingSkeleton.tsx  # Skeleton loader
│   └── Footer.tsx
├── lib/
│   └── utils.ts             # cn() helper (clsx + tailwind-merge)
├── types/
│   └── weather.ts           # WeatherData interface
├── App.tsx                  # Root component, state management
├── main.tsx                 # Entry point
└── index.css                # Tailwind directives + animations
```

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start dev server at localhost:5173 |
| `npm run build`   | Type-check and build to `/dist`    |
| `npm run preview` | Preview production build locally   |

## Deployment

Build the app and deploy the `/dist` folder to Vercel, Netlify, or any static host.

```bash
npm run build
```

Set `VITE_API_URL` as an environment variable in your hosting dashboard before building, pointing to your deployed server.
