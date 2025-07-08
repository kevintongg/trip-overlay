# GEMINI.md

This file provides guidance to AI assistants when working with code in this repository.

## Project Overview

This is a real-time GPS tracking overlay for live streaming, built with **React 19, TypeScript, and Vite**. It connects to the RTIRL (Real-Time IRL) API to display trip progress, animated avatars, speed, location, and weather information. The project is designed for IRL streamers using OBS and cloud platforms like IRLToolkit.

It consists of two main overlays:

1.  **Trip Overlay**: Tracks and visualizes trip distance and progress.
2.  **Dashboard**: Displays detailed real-time data like speed, location, and weather.

## Development Commands

### Primary Workflow

- `pnpm install`: Install all dependencies.
- `pnpm dev`: Start the Vite development server (usually at http://localhost:5173).
- `pnpm build`: Build the production-ready application.
- `pnpm preview`: Preview the production build locally.

### Code Quality & Testing

- `pnpm lint`: Run ESLint for code analysis.
- `pnpm lint:fix`: Automatically fix linting issues.
- `pnpm format`: Format code with Prettier.
- `pnpm test`: Run the unit and integration tests with Vitest.

### Local Testing

- Access the overlays via the Vite dev server URL (e.g., `http://localhost:5173/trip.html` and `http://localhost:5173/dashboard.html`).
- Use the `?demo=true` URL parameter for testing without a live RTIRL connection.
- For local testing of Cloudflare functions (like the weather API), you can use `pnpm wrangler pages dev .`.

## Architecture (React 19 + TypeScript)

### Technology Stack

- **React 19**: For building the component-based UI using modern hooks.
- **TypeScript**: Ensures full type safety and better developer experience.
- **Vite**: Provides a fast development server and optimized production builds.
- **Zustand**: For lightweight, global client-state management (e.g., trip state, connection status).
- **React Query**: For managing server state, including caching and refetching for the weather API.
- **Tailwind CSS & shadcn/ui**: For utility-first styling and a modern component library.

### File Structure

```
src/
├── components/     # React components (UI, core, layout)
├── hooks/          # Custom React hooks for logic reuse
├── store/          # Zustand state management stores
├── utils/          # Utility functions and services (GPS, API clients)
├── types/          # TypeScript type definitions
├── styles/         # Global CSS styles
├── TripOverlay.tsx # Entry component for the trip progress overlay
├── Dashboard.tsx   # Entry component for the dashboard overlay
├── trip-main.tsx   # React root for the trip overlay
└── dashboard-main.tsx # React root for the dashboard
```

### State Management

- **Client State (Zustand)**: `tripStore`, `weatherStore`, and `connectionStore` manage the application's UI and session state. State is persisted to `localStorage` where necessary.
- **Server State (React Query)**: Manages asynchronous operations like fetching weather data, with automatic caching, retries, and background updates.

- **Client State (Zustand)**: `tripStore`, `weatherStore`, and `connectionStore` manage the application's UI and session state. State is persisted to `localStorage` where necessary.
- **Server State (React Query)**: Manages asynchronous operations like fetching weather data, with automatic caching, retries, and background updates.

### Key Features

- **Component-Based Architecture**: UI is built with reusable React components.
- **RTIRL Integration**: `useRtirlSocket` hook manages the WebSocket connection for live GPS data.
- **Type Safety**: Full TypeScript coverage for robust and maintainable code.
- **Cloud-Friendly Controls**: URL parameters and a global console API are preserved for remote control in cloud environments (e.g., IRLToolkit).
- **Weather Integration**: A serverless function (`functions/weather.js`) proxies requests to the OpenWeatherMap API, with data fetched via React Query.

## AI Assistant Guidance

- **Prioritize Modern React Patterns**: Use functional components with hooks. Avoid class components.
- **Utilize `pnpm`**: The project uses `pnpm` for all package management and scripts.
- **TypeScript First**: Ensure all new code is strongly typed. Use the types defined in `src/types/`.
- **Centralized Configuration**: All configuration is managed in `src/utils/config.ts`.
- **State Management**: Use Zustand for client state and React Query for server state. Do not introduce new state management libraries.
- **Backward Compatibility**: Maintain the existing `window.TripOverlay.controls` API and all URL parameters for compatibility with streaming setups.
