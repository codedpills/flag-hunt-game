# App Flow Documentation for Browser-Based Flag Hunt Game

This document outlines the complete flow of the application from the moment a user lands on the website through joining a game session, gameplay, and post-game interactions. It is intended to serve as a guide for developers using Cursor to ensure a comprehensive understanding of the user journey.

---

## 1. Landing Page / Home Screen

- **Layout:**
  - **Left Panel:**
    - **User Login/Join:**
      - Input field for nickname.
      - Character selection area displaying available stick figure avatars with fruit-themed heads.
      - Option to randomize/rotate the character until the user is satisfied.
    - **Join Button:**
      - Initiates the process to enter the lobby.
  - **Right Panel:**
    - A vibrant, playful slideshow that explains the game mechanics and features.
    - Visual aids and text instructions on how to play the game.

- **User Actions:**
  - Enter a nickname.
  - Select or randomize the avatar.
  - Click the "Join Game" button to proceed.

---

## 2. User Onboarding

- **Avatar Customization:**
  - Users review and choose their stick figure with unique fruit-themed heads.
  - The UI allows random rotation until the preferred appearance is selected.
  
- **Nickname Setup:**
  - Users input a nickname which will be used in the game session and on leaderboards.

---

## 3. Lobby / Game Setup

- **Overview:**
  - Upon joining, users are taken to a lobby where they configure game settings before starting a session.
  
- **Lobby Components:**
  - **Game Mode Selection:**
    - **Normal Game:** Capture multiple flags within a time limit.
    - **Red Flag:** Team-based mode where capturing a single red flag wins the game.
    - **Last Ones Out:** Escape the maze by reaching the designated exit door.
  - **Player Count:**
    - Select a number of participants (ranging from 2 to 40 players).
  - **Custom Settings:**
    - Game duration (time limit).
    - Number of flags.
    - Difficulty level.
  - **Invite Feature:**
    - A shareable link is generated to invite friends to join the same session.
  - **Start Game Button:**
    - Finalizes the lobby setup and transitions all users into the game arena.

- **User Actions:**
  - Select game mode and adjust custom settings.
  - Generate and share the invite link.
  - Click "Start Game" to begin the session.

---

## 4. Game Arena / Main Gameplay

- **Map Display:**
  - **Canvas Rendering:**
    - An infinite scrollable, maze-like map displayed in a black-and-white, stylized design.
    - The map can be an artificially created maze or a stylized version of a real GPS map.
  - **Starting Point:**
    - All players start from the same designated point on the map.
  
- **User Interface Elements:**
  - **Player Character:**
    - Each user sees only their own character (the chosen stick figure) navigating the map.
  - **Flags and Icons:**
    - Flags are visible as clickable icons placed in strategic locations.
    - In Red Flag mode, a single red flag is highlighted.
    - In Last Ones Out mode, an exit door is prominently displayed.
  - **Navigation Controls:**
    - Movement using keyboard arrow keys.
    - Alternatively, directional mouse clicks for navigation.
  - **Sound Effects & Visual Cues:**
    - In-game sounds for actions like flag capture, countdown, or game events.
    - Visual feedback for interactions (e.g., flag status changes, exit reached).

- **Gameplay Dynamics:**
  - **Normal Game:**
    - Players navigate to click on flags; captured flags update visually.
    - Points are accumulated based on the number of flags captured.
  - **Red Flag:**
    - Players are divided into groups.
    - The game ends immediately when a group captures the single red flag.
    - Secondary scoring is based on additional flags collected.
  - **Last Ones Out:**
    - Players must navigate from the center to the exit door within the set time.
    - Rankings are determined by the exit times and those unable to exit lose.

- **User Actions:**
  - Navigate the map using provided controls.
  - Click on flags to capture them.
  - Listen for sound cues and follow visual instructions.

---

## 5. End Game and Post-Game Flow

- **Game Conclusion:**
  - **Time Expiry/Objective Completion:**
    - The game ends either when the timer runs out or the key objective (red flag capture or exit reached) is achieved.
  
- **Leaderboard Display:**
  - A summary screen shows:
    - Player rankings.
    - Total points and flags captured (or exit times for Last Ones Out mode).
    - Group performance details (if applicable).

- **User Options Post-Game:**
  - **Restart Option:**
    - Button to return to the lobby to configure a new game session.
  - **Exit to Home:**
    - Option to go back to the home screen for further customization or to leave the game.

---

## 6. Additional Considerations

- **Multiplayer Isolation:**
  - Each user only sees their own character on the map; other players are abstracted to maintain simplicity.
- **Responsive Design:**
  - The interface adapts to different screen sizes and browser environments.
- **Internationalization:**
  - Support for multiple languages with English as the default.

---

## 7. Flow Diagram (Conceptual Overview)

```mermaid
flowchart TD
    A[Landing Page / Home Screen]
    B[User Onboarding]
    C[Lobby / Game Setup]
    D[Game Arena / Main Gameplay]
    E[End Game & Leaderboard]
    F[Post-Game Options]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> C
    F --> A
