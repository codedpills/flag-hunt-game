import { useCallback } from 'react';
import { api } from '../services/api';
import { useGameStore } from '../store/gameStore';
import { GameSettings } from '../types/game';

const DEFAULT_DURATION = 300; // 5 minutes

export const useSessionManager = () => {
  const { session, updateSession } = useGameStore();

  const createSession = useCallback(async (settings: GameSettings) => {
    try {
      console.log('Creating session with settings:', settings);
      const session = await api.createSession(settings);
      
      if (!session || !session.id) {
        throw new Error('Failed to create session: Invalid response from server');
      }
      
      console.log('Session created successfully:', session);
      updateSession(session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }, [updateSession]);

  const joinSession = useCallback(async (sessionId: string, nickname: string, avatar: string) => {
    try {
      console.log(`Joining session ${sessionId} with nickname ${nickname}`);
      const result = await api.joinSession(sessionId, nickname, avatar);
      console.log('Join session result:', result);
      
      if (!result || !result.session) {
        throw new Error('Failed to join session: Invalid response from server');
      }
      
      updateSession(result.session);
      return result.session;
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  }, [updateSession]);

  const getSession = useCallback(async (sessionId: string) => {
    try {
      console.log('Attempting to get session with ID:', sessionId);
      
      // Check if we already have this session loaded
      if (session && session.id === sessionId) {
        console.log('Session already loaded in state:', session);
        return session;
      }
      
      // Otherwise fetch it from the API
      console.log('Fetching session from API...');
      const fetchedSession = await api.getSession(sessionId);
      
      if (!fetchedSession) {
        console.error('No session returned from API');
        throw new Error('Session not found');
      }
      
      console.log('Successfully fetched session:', fetchedSession);
      
      // Get the current player from localStorage
      const playerName = localStorage.getItem('player');
      const avatar = localStorage.getItem('avatar');
      
      // Check if we need to add the current player to the session
      if (playerName && avatar) {
        // Create a player object if it doesn't exist in the session
        const existingPlayer = fetchedSession.players?.find(p => p.nickname === playerName);
        
        if (!existingPlayer) {
          console.log('Adding current player to session');
          const playerId = `player-${Date.now()}`;
          const player = {
            id: playerId,
            nickname: playerName,
            avatar: avatar,
            position: { x: 0, y: 0 },
            score: 0,
            status: 'active' as const
          };
          
          // Add player to the session
          fetchedSession.players = [...(fetchedSession.players || []), player];
          
          // Set the current player in the store
          const gameStore = useGameStore.getState();
          gameStore.setCurrentPlayer(player);
        } else {
          console.log('Current player already exists in session:', existingPlayer);
          // Set the existing player as current player
          const gameStore = useGameStore.getState();
          gameStore.setCurrentPlayer(existingPlayer);
        }
      }
      
      // Update the session in the store
      updateSession(fetchedSession);
      return fetchedSession;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw error;
    }
  }, [session, updateSession]);

  const startSessionTimer = useCallback((sessionId: string) => {
    const currentSession = session;
    if (!currentSession || currentSession.id !== sessionId) return () => {};

    const duration = currentSession.settings?.duration || DEFAULT_DURATION;
    
    if (currentSession.status === 'in-progress') {
      const timer = setInterval(() => {
        // Update session timer logic
        console.log(`Session ${sessionId} timer tick, ${duration} seconds remaining`);
      }, 1000);

      return () => clearInterval(timer);
    }
    
    return () => {};
  }, [session]);

  return { createSession, joinSession, getSession, startSessionTimer, session };
};
