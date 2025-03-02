// This file would be used in a real implementation to create a Node.js server
// For now, it's just a placeholder to show how the server would be structured

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store (would use a database in production)
const sessions = new Map();
const players = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Get session and player IDs from query params
  const { sessionId, playerId } = socket.handshake.query;
  
  if (sessionId && playerId) {
    // Join the session room
    socket.join(sessionId);
    
    // Store socket ID mapping
    players.set(playerId, socket.id);
    
    // Notify other players that a new player has joined
    socket.to(sessionId).emit('player:join', {
      playerId,
      // Would include player details from database
    });
  }
  
  // Handle player movement
  socket.on('player:move', ({ sessionId, playerId, position }) => {
    // Broadcast to all other players in the session
    socket.to(sessionId).emit('player:move', { playerId, position });
    
    // Update player position in memory (would update database in production)
    const session = sessions.get(sessionId);
    if (session) {
      const playerIndex = session.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        session.players[playerIndex].position = position;
      }
    }
  });
  
  // Handle flag capture
  socket.on('flag:capture', ({ sessionId, playerId, flagId }) => {
    // Broadcast to all other players in the session
    socket.to(sessionId).emit('flag:capture', { playerId, flagId });
    
    // Update flag status in memory (would update database in production)
    const session = sessions.get(sessionId);
    if (session) {
      const flagIndex = session.flags.findIndex(f => f.id === flagId);
      if (flagIndex !== -1) {
        session.flags[flagIndex].status = 'captured';
        session.flags[flagIndex].capturedBy = playerId;
        session.flags[flagIndex].capturedAt = new Date();
      }
      
      // Update player score
      const playerIndex = session.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        session.players[playerIndex].score += 1;
      }
    }
  });
  
  // Handle game start
  socket.on('game:start', ({ sessionId }) => {
    // Broadcast to all players in the session
    io.to(sessionId).emit('game:start', {
      startTime: new Date(),
      // Would include additional game data
    });
    
    // Update session status in memory (would update database in production)
    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'in-progress';
      session.startTime = new Date();
    }
  });
  
  // Handle player leave
  socket.on('player:leave', ({ sessionId, playerId }) => {
    // Broadcast to all other players in the session
    socket.to(sessionId).emit('player:leave', playerId);
    
    // Update player status in memory (would update database in production)
    const session = sessions.get(sessionId);
    if (session) {
      const playerIndex = session.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        session.players[playerIndex].status = 'disconnected';
      }
    }
    
    // Remove socket ID mapping
    players.delete(playerId);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find player by socket ID and update status
    for (const [playerId, socketId] of players.entries()) {
      if (socketId === socket.id) {
        // Find session containing this player
        for (const [sessionId, session] of sessions.entries()) {
          const playerIndex = session.players.findIndex(p => p.id === playerId);
          if (playerIndex !== -1) {
            // Update player status
            session.players[playerIndex].status = 'disconnected';
            
            // Notify other players
            socket.to(sessionId).emit('player:leave', playerId);
            break;
          }
        }
        
        // Remove socket ID mapping
        players.delete(playerId);
        break;
      }
    }
  });
});

// REST API routes

// Create a new game session
app.post('/api/sessions', (req, res) => {
  const { settings } = req.body;
  
  // Generate a unique session ID
  const sessionId = `session-${Date.now()}`;
  
  // Create flags
  const flags = [];
  for (let i = 0; i < settings.flagCount; i++) {
    flags.push({
      id: `flag-${i}`,
      position: {
        x: Math.floor(Math.random() * 2000) - 1000,
        y: Math.floor(Math.random() * 2000) - 1000,
      },
      status: 'available',
    });
  }
  
  // Create session
  const session = {
    id: sessionId,
    settings,
    players: [],
    flags,
    status: 'waiting',
    createdAt: new Date(),
  };
  
  // Store session in memory (would store in database in production)
  sessions.set(sessionId, session);
  
  res.status(201).json(session);
});

// Join a game session
app.post('/api/sessions/:sessionId/join', (req, res) => {
  const { sessionId } = req.params;
  const { nickname, avatar } = req.body;
  
  // Check if session exists
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Generate a unique player ID
  const playerId = `player-${Date.now()}`;
  
  // Create player
  const player = {
    id: playerId,
    nickname,
    avatar,
    position: { x: 0, y: 0 },
    score: 0,
    status: 'active',
    joinedAt: new Date(),
  };
  
  // Add player to session
  session.players.push(player);
  
  res.status(200).json({ player, session });
});

// Get session details
app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Check if session exists
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.status(200).json(session);
});

// Update player position
app.put('/api/sessions/:sessionId/players/:playerId/position', (req, res) => {
  const { sessionId, playerId } = req.params;
  const { x, y } = req.body;
  
  // Check if session exists
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Find player
  const playerIndex = session.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Update player position
  session.players[playerIndex].position = { x, y };
  
  res.status(200).json({ success: true });
});

// Capture a flag
app.put('/api/sessions/:sessionId/flags/:flagId/capture', (req, res) => {
  const { sessionId, flagId } = req.params;
  const { playerId } = req.body;
  
  // Check if session exists
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Find flag
  const flagIndex = session.flags.findIndex(f => f.id === flagId);
  if (flagIndex === -1) {
    return res.status(404).json({ error: 'Flag not found' });
  }
  
  // Check if flag is already captured
  if (session.flags[flagIndex].status === 'captured') {
    return res.status(400).json({ error: 'Flag already captured' });
  }
  
  // Find player
  const playerIndex = session.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Update flag status
  session.flags[flagIndex].status = 'captured';
  session.flags[flagIndex].capturedBy = playerId;
  session.flags[flagIndex].capturedAt = new Date();
  
  // Update player score
  session.players[playerIndex].score += 1;
  
  res.status(200).json({ success: true });
});

// Leave a session
app.put('/api/sessions/:sessionId/players/:playerId/leave', (req, res) => {
  const { sessionId, playerId } = req.params;
  
  // Check if session exists
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Find player
  const playerIndex = session.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  // Update player status
  session.players[playerIndex].status = 'disconnected';
  
  res.status(200).json({ success: true });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;