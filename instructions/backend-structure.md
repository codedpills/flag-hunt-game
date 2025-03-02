# Backend Structure Overview for Browser-Based Flag Hunt Game

This document provides a comprehensive overview of the backend architecture for the Browser-Based Flag Hunt Game. The backend is designed using Node.js for server-side logic, Supabase (with PostgreSQL) for database management, and WebSockets for real-time communication. For the initial version, no formal user authentication is required —- users join game sessions via a shareable link, keeping the onboarding process simple and anonymous.

---

## 1. Technology Stack

- **Node.js:**  
  Used as the primary runtime environment to build the API server and manage server-side game logic.

- **Supabase (PostgreSQL):**  
  Utilized for data storage and real-time database subscriptions. Supabase simplifies backend operations by providing a managed PostgreSQL database with real-time features.

- **WebSockets:**  
  Employed to handle real-time communication between the server and clients, ensuring smooth updates for player movements, flag captures, and leaderboard changes.

---

## 2. High-Level Architecture

The backend architecture consists of the following key components:

- **API Server (Node.js):**  
  Manages RESTful API endpoints, game session creation, game logic processing, and integration with Supabase for database operations.

- **Database (Supabase/PostgreSQL):**  
  Stores persistent data including game sessions, player states, flags, and game events.

- **Real-Time Communication (WebSockets):**  
  Provides low-latency communication for in-game events such as player movements, flag captures, and leaderboard updates.

- **Supabase Services:**  
  Leverage Supabase’s real-time capabilities to subscribe to database changes and push updates to clients where applicable.

---

## 3. Detailed Components

### 3.1 API Server

- **Framework & Structure:**
  - **Node.js Framework:**  
    Use Express (or a similar lightweight framework) for setting up the server.
  - **Server Entry Point:**  
    A primary file (e.g., `server.js` or `app.js`) that initializes the server, sets up middleware, and manages route definitions.

- **Modules & Routes:**
  - **Game Session Routes:**
    - **Session Creation:**  
      Endpoint to create a new game session. A shareable link is generated upon creation, which users can use to join the session.
    - **Session Management:**  
      Endpoints to update or retrieve game session details, such as game mode, player count, and custom settings.
  - **Gameplay & Score Routes:**
    - **Flag Capture:**  
      Endpoints to process flag capture events and update game state.
    - **Score & Leaderboard:**  
      Endpoints to update player scores and retrieve leaderboard data after a game session concludes.

- **Business Logic & Services:**
  - Implement game mechanics such as flag capture, scoring, and session lifecycle management.
  - Manage session state synchronization using real-time event handling.
  - Interface with WebSocket handlers to broadcast in-game events.

- **WebSocket Handlers:**
  - Manage client connections and maintain a mapping of active game sessions.
  - Broadcast real-time events (player movements, flag captures, game state changes) to connected clients.
  - Optionally integrate with Supabase’s real-time triggers to relay database changes.

---

### 3.2 Database (Supabase/PostgreSQL)

- **Schema Design:**
  - **Game Sessions Table:**
    - Columns: `session_id`, `host_id` (optional for session creator tracking), `game_mode`, `player_count`, `settings` (JSONB), `start_time`, `end_time`.
  - **Game Players Table:**
    - Columns: `player_id`, `session_id`, `nickname` (entered by the user), `avatar` (selected or randomized), `current_score`, `position` (coordinates), `status` (active, exited, etc.).
  - **Flags Table:**
    - Columns: `flag_id`, `session_id`, `position` (coordinates), `status` (available, captured), `captured_by` (player id), `captured_at`.
  - **Game Events Table (Optional):**
    - Columns: `event_id`, `session_id`, `event_type` (flag capture, movement, exit, etc.), `event_data` (JSONB), `timestamp`.

- **Utilizing Supabase Features:**
  - **Real-Time Subscriptions:**  
    Use Supabase’s built-in real-time subscriptions to push database changes (such as flag status updates or score changes) to connected clients.
  - **Triggers:**  
    Optionally set up database triggers to automatically update scores or notify the API server upon key events.

---

### 3.3 Real-Time Communication with WebSockets

- **Purpose:**  
  Ensure instantaneous updates for gameplay events (e.g., player movements, flag captures, leaderboard updates) with minimal latency.

- **Implementation:**
  - **WebSocket Server:**  
    Integrated within the Node.js server or deployed as a dedicated service.
  - **Connection Management:**  
    - Assign unique IDs to each client connection.
    - Maintain mappings of active game sessions and connected clients.
  - **Event Handlers:**
    - **Player Movements:** Broadcast location updates.
    - **Flag Captures:** Notify all participants when a flag is captured and update its status.
    - **Session State Changes:** Handle game start, in-progress events, and termination.
  - **Integration with Supabase:**  
    Optionally use Supabase real-time features to relay database updates to clients via WebSocket notifications.

---

## 4. Data Flow and Integration

### 4.1 Session Initialization and Joining

- **Session Creation:**  
  The API server creates a new game session and records its details in the `Game Sessions` table.
  
- **Joining via Shareable Link:**  
  Users access the session directly through a unique shareable link.  
  - Their details (nickname and avatar) are stored in the `Game Players` table under the corresponding session.
  - No traditional sign-up/sign-in process is required.

- **WebSocket Connection Establishment:**  
  After joining the session, a WebSocket connection is established to handle real-time game events.

### 4.2 Gameplay and Real-Time Updates

- **Event Handling:**  
  As users navigate and interact with the game (e.g., moving, capturing flags), events are sent via WebSocket messages to the API server.
  
- **Data Synchronization:**  
  The server processes events, updates database records, and broadcasts updates to all connected clients.
  
- **Real-Time Database Integration:**  
  Utilize Supabase real-time subscriptions to monitor key database changes and relay them via WebSockets.

### 4.3 Game Conclusion and Leaderboard Updates

- **Session Termination:**  
  When a game session ends (either by time expiry or completion of an objective), the final game state is computed.
  
- **Leaderboard Generation:**  
  The server compiles final scores from the `Game Players` table and broadcasts leaderboard data via REST endpoints and/or WebSocket events.
  
- **Post-Game Options:**  
  Clients receive options to restart a session or return to the home screen.

---

## 5. Deployment and Scalability Considerations

- **Deployment:**
  - **Node.js Server:**  
    Deployed on a scalable platform (e.g., Heroku, Vercel, or a cloud provider).
  - **Supabase:**  
    Utilizes Supabase’s managed PostgreSQL and real-time services.
  - **WebSocket Server:**  
    Configured to handle concurrent connections efficiently with potential for horizontal scaling.

- **Scalability:**
  - Employ load balancing for the Node.js server.
  - Optimize database queries and create appropriate indexes.
  - Implement robust error handling and reconnection logic for WebSocket connections.

---

## 6. Summary

This backend architecture leverages Node.js, Supabase (with PostgreSQL), and WebSockets to deliver a robust, scalable, and efficient server environment for the Browser-Based Flag Hunt Game. By simplifying user onboarding (eliminating traditional authentication) and allowing anonymous session joining via shareable links, the initial version remains streamlined while still supporting real-time multiplayer interactions and efficient data management.

---

## 7. Additional Considerations

- ** Code Organization:**
  - Keep the code organized and modular.
  - Split the code into multiple files and folders where appropriate (kebab-case for folders and files).
  - Use a TDD approach to development.
  - Use TypeScript
  - Use meaningful variable and function names (camelCase for variables and functions).
  - Add comments where appropriate to explain why behind the code in more complex functions.
  - Keep functions small and focused (single responsibility).
  - Use Biome for linting and formatting.
  - Handle errors and edge cases gracefully.

