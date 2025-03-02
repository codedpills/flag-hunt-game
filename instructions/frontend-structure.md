# Frontend Structure Overview for Browser-Based Flag Hunt Game

This document outlines the overall frontend architecture and development strategy for the Browser-Based Flag Hunt Game. The project leverages TypeScript, React (with Vite and React Router 7 or Tanstack Router), Tailwind CSS, and HTML5 Canvas/WebGL for rendering, and adopts a Test-Driven Development (TDD) approach with Playwright, Vitest, and React Testing Library.

---

## 1. Technology Stack

- **Language:** TypeScript
- **Framework:** React
- **Bundler/Dev Environment:** Vite
- **Routing:** React Router 7 or Tanstack Router
- **Styling:** Tailwind CSS
- **Rendering:** HTML5 Canvas or WebGL (for map and character rendering)
- **Testing:** Playwright, Vitest, and React Testing Library

---

## 2. High-Level Architecture

- **Component-Based Architecture:**  
  Build the UI using reusable React components that encapsulate specific functionalities (e.g., navigation, game components, UI elements).

- **Routing:**  
  Define clear routes for the application using React Router (or Tanstack Router) to manage navigation between pages like Home, Lobby, Game Arena, and Leaderboard.

- **Rendering:**  
  Use HTML5 Canvas or WebGL encapsulated in a React component (e.g., `MapCanvas.tsx`) to render the interactive map and game elements dynamically.

- **State Management & API Integration:**  
  Manage local state using React hooks or context and integrate API/WebSocket calls via custom hooks or service modules.

---

## 3. Folder Structure (Example)

/src
  /components
    /common
      Button.tsx           # Common button component
      Modal.tsx           # Common modal component  
      Input.tsx           # Common input component
    /game
      MapCanvas.tsx       # Handles canvas/WebGL rendering
      Character.tsx       # Renders the player's stick figure
      Flag.tsx           # Renders flag elements
    /lobby
      Lobby.tsx          # Game lobby interface
      GameSetupForm.tsx  # Game settings form
    /ui
      Header.tsx         # Header component
      Footer.tsx         # Footer component
  
  /pages
    Home.tsx             # Landing page with join options and slideshow
    LobbyPage.tsx        # Lobby where users configure game settings
    GamePage.tsx         # Main game arena with map and controls
    LeaderboardPage.tsx  # Post-game leaderboard view
  
  /routes
    AppRoutes.tsx        # Routing configuration using React Router or Tanstack Router
  
  /services
    api.ts              # API service calls (REST endpoints)
    websocket.ts        # WebSocket connection and event handling
  
  /styles
    index.css           # Tailwind CSS imports and custom styles
  
  /tests
    /components         # Component tests
    /pages             # Page tests
    /integration       # E2E tests using Playwright
  
  /utils
    helpers.ts          # Helper functions
    constants.ts        # Constants and configuration
  
  index.html
  main.tsx
  vite.config.ts


---

## 4. Routing Structure

- **Route Definitions:**
  - `/` — Home (landing page with onboarding)
  - `/lobby` — Lobby for game configuration and shareable link generation
  - `/game` — Game arena where the canvas renders the map and gameplay occurs
  - `/leaderboard` — Leaderboard displaying final scores and rankings

- **Navigation:**  
  Use React Router (or Tanstack Router) to manage navigation and ensure smooth transitions between these pages.

---

## 5. Rendering Components

- **Map and Game Rendering:**
  - **MapCanvas Component:**  
    Encapsulates the HTML5 Canvas or WebGL context to render the maze-like map and dynamic game elements.
  - **Game Elements:**  
    Separate components (e.g., `Character.tsx`, `Flag.tsx`) to render interactive elements on the canvas, managing state and animations.

- **UI Components:**
  - Create reusable UI components (buttons, forms, modals) styled with Tailwind CSS for a consistent and responsive design.

---

## 6. API and WebSocket Integration

- **API Service Module (`/services/api.ts`):**
  - Define functions to interact with backend REST endpoints for session creation, game state updates, and leaderboard retrieval.

- **WebSocket Service Module (`/services/websocket.ts`):**
  - Establish and manage WebSocket connections.
  - Create custom hooks to subscribe to real-time game events (e.g., player movements, flag captures) and broadcast these to the relevant components.

---

## 7. Testing Strategy (TDD Approach)

- **Unit Testing:**
  - Use **Vitest** and **React Testing Library** to write unit tests for individual components.
  - Test component rendering, state changes, and user interactions in isolation.

- **End-to-End Testing:**
  - Use **Playwright** to develop end-to-end tests simulating complete user workflows—from landing page interactions to gameplay and leaderboard validation.
  
- **TDD Practices:**
  - Write tests before implementation to guide feature development.
  - Use mocks for API and WebSocket services to isolate test cases.
  - Integrate automated tests in CI/CD pipelines to maintain code quality and prevent regressions.

---

## 8. Development Workflow

- **Setup:**
  - Configure Vite for fast development builds and hot module replacement.
  - Set up ESLint, Prettier, and TypeScript for code quality and consistency.

- **Build & Deployment:**
  - Use Vite’s production build for bundling and optimization.
  - Implement code splitting and lazy-loading for performance improvements.
  - Deploy to a hosting platform (e.g., Vercel, Netlify) with integrated CI/CD pipelines.

- **CI/CD Integration:**
  - Automate testing (unit and e2e) as part of the build process.
  - Ensure tests run on every commit to catch issues early.

---

## 9. Summary

This frontend-structure.md document provides a detailed overview of the technology stack, architectural components, folder structure, routing, rendering strategy, and testing methodology for the Browser-Based Flag Hunt Game. Leveraging TypeScript, React, Vite, Tailwind CSS, and a TDD approach ensures a robust, maintainable, and scalable codebase for building a dynamic and engaging game experience.


## 10. Additional Considerations

- ** Code Organization:**
  - Keep the code organized and modular.
  - Split the code into multiple files and folders where appropriate (kebab-case for folders and files).
  - Use a TDD approach to development.
  - Use TypeScript
  - Use meaningful variable and function names (camelCase for variables and functions).
  - Use PascalCase for component names.
  - Use Biome for linting and formatting.
  - Add comments where appropriate to explain why behind the code in more complex functions.
  - Keep functions small and focused (single responsibility).
  - Handle errors and edge cases gracefully.
