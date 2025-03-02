import { create } from 'zustand';
import { GameSession, GameSettings, Player, Position, Flag } from '../types/game';
import { api } from '../services/api';

interface GameState {
  session: GameSession | null;
  currentPlayer: Player | null;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  createSession: (settings: GameSettings) => Promise<void>;
  joinSession: (sessionId: string, nickname: string, avatar: string) => Promise<void>;
  updatePlayerPosition: (position: Position) => void;
  captureFlag: (flagId: string) => void;
  leaveSession: () => void;
  setError: (error: string | null) => void;
  
  // New actions for Supabase integration
  updateSession: (session: GameSession) => void;
  updatePlayers: (players: Player[]) => void;
  updateFlags: (flags: Flag[]) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  currentPlayer: null,
  isConnected: false,
  error: null,
  
  createSession: async (settings: GameSettings) => {
    try {
      const session = await api.createSession(settings);
      set({ session });
    } catch (error) {
      console.error('Error creating session:', error);
      set({ error: 'Failed to create game session' });
    }
  },
  
  joinSession: async (sessionId: string, nickname: string, avatar: string) => {
    try {
      const { player, session } = await api.joinSession(sessionId, nickname, avatar);
      set({ 
        currentPlayer: player, 
        session, 
        isConnected: true 
      });
    } catch (error) {
      console.error('Error joining session:', error);
      set({ error: 'Failed to join game session' });
    }
  },
  
  updatePlayerPosition: (position: Position) => {
    const { currentPlayer, session } = get();
    if (!currentPlayer) return;
    
    console.log('Updating player position in store:', position);
    
    // Update current player position
    const updatedPlayer = {
      ...currentPlayer,
      position,
    };
    
    // Also update the player in the session's players array
    let updatedPlayers = [];
    if (session && session.players) {
      updatedPlayers = session.players.map(player => 
        player.id === currentPlayer.id ? updatedPlayer : player
      );
    }
    
    set({
      currentPlayer: updatedPlayer,
      session: session ? {
        ...session,
        players: updatedPlayers,
      } : null,
    });
  },
  
  captureFlag: (flagId: string) => {
    const { session, currentPlayer } = get();
    if (!session || !currentPlayer) return;
    
    // Find the flag and update its status
    const updatedFlags = session.flags.map(flag => 
      flag.id === flagId 
        ? { 
            ...flag, 
            status: 'captured', 
            capturedBy: currentPlayer.id,
            capturedAt : new Date()
          } 
        : flag
    );
    
    // Update player score
    const updatedPlayer = {
      ...currentPlayer,
      score: currentPlayer.score + 1,
    };
    
    set({
      session: {
        ...session,
        flags: updatedFlags,
      },
      currentPlayer: updatedPlayer,
    });
  },
  
  leaveSession: () => {
    set({
      session: null,
      currentPlayer: null,
      isConnected: false,
    });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  // New actions for Supabase integration
  updateSession: (session: GameSession) => {
    set({ session });
  },
  
  updatePlayers: (players: Player[]) => {
    const { session, currentPlayer } = get();
    if (!session) return;
    
    // Update the current player if it's in the list
    let updatedCurrentPlayer = currentPlayer;
    if (currentPlayer) {
      const newCurrentPlayerData = players.find(p => p.id === currentPlayer.id);
      if (newCurrentPlayerData) {
        updatedCurrentPlayer = {
          ...currentPlayer,
          ...newCurrentPlayerData,
        };
      }
    }
    
    set({
      session: {
        ...session,
        players,
      },
      currentPlayer: updatedCurrentPlayer,
    });
  },
  
  updateFlags: (flags: Flag[]) => {
    const { session } = get();
    if (!session) return;
    
    set({
      session: {
        ...session,
        flags,
      },
    });
  },
}));