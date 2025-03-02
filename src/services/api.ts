import { GameSettings, GameSession, Player, Flag, Position } from '../types/game';
import { supabase } from '../lib/supabase';

// API service for interacting with Supabase
export const api = {
  // Session management
  async createSession(settings: GameSettings): Promise<GameSession> {
    try {
      const sessionId = `session-${Date.now()}`;
      
      // Create session in Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          id: sessionId,
          settings,
          status: 'waiting',
        })
        .select()
        .single();
      
      if (sessionError) throw sessionError;
      
      // Create flags for the session
      const flags: Flag[] = [];
      const flagInserts = [];
      
      for (let i = 0; i < settings.flagCount; i++) {
        const flagId = `flag-${i}-${sessionId}`;
        const position = { 
          x: Math.floor(Math.random() * 2000) - 1000, 
          y: Math.floor(Math.random() * 2000) - 1000 
        };
        
        flags.push({
          id: flagId,
          position,
          status: 'available',
        });
        
        flagInserts.push({
          id: flagId,
          session_id: sessionId,
          position,
          status: 'available',
        });
      }
      
      // Insert flags in batches to avoid payload size limits
      const batchSize = 50;
      for (let i = 0; i < flagInserts.length; i += batchSize) {
        const batch = flagInserts.slice(i, i + batchSize);
        const { error: flagsError } = await supabase
          .from('flags')
          .insert(batch);
        
        if (flagsError) {
          console.error('Error inserting flags batch:', flagsError);
        }
      }
      
      return {
        id: sessionId,
        settings,
        players: [],
        flags,
        status: 'waiting',
        startTime: new Date(),
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },
  
  async joinSession(sessionId: string, nickname: string, avatar: string): Promise<{ player: Player, session: GameSession }> {
    try {
      // Check if session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) {
        // If session doesn't exist, create a new one with default settings
        if (sessionError.code === 'PGRST116') {
          const defaultSettings: GameSettings = {
            gameMode: 'normal',
            playerCount: 10,
            duration: 300,
            flagCount: 20,
            difficulty: 'medium',
          };
          
          const newSession = await this.createSession(defaultSettings);
          sessionId = newSession.id;
        } else {
          throw sessionError;
        }
      }
      
      // Create player
      const playerId = `player-${Date.now()}`;
      const playerPosition = { x: 0, y: 0 };
      
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          id: playerId,
          session_id: sessionId,
          nickname,
          avatar,
          position: playerPosition,
          score: 0,
          status: 'active',
        })
        .select()
        .single();
      
      if (playerError) throw playerError;
      
      // Get all flags for the session
      const { data: flagsData, error: flagsError } = await supabase
        .from('flags')
        .select('*')
        .eq('session_id', sessionId);
      
      if (flagsError) throw flagsError;
      
      // Get all players for the session
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId);
      
      if (playersError) throw playersError;
      
      // Format data for the client
      const player: Player = {
        id: playerId,
        nickname,
        avatar,
        position: playerPosition,
        score: 0,
        status: 'active',
      };
      
      const flags: Flag[] = flagsData.map(flag => ({
        id: flag.id,
        position: flag.position as Position,
        status: flag.status as 'available' | 'captured',
        capturedBy: flag.captured_by,
        capturedAt: flag.captured_at ? new Date(flag.captured_at) : undefined,
      }));
      
      const players: Player[] = playersData.map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        position: p.position as Position,
        score: p.score,
        status: p.status as 'active' | 'exited' | 'disconnected',
      }));
      
      const session: GameSession = {
        id: sessionId,
        settings: sessionData?.settings as GameSettings || {
          gameMode: 'normal',
          playerCount: 10,
          duration: 300,
          flagCount: 20,
          difficulty: 'medium',
        },
        players,
        flags,
        status: sessionData?.status as 'waiting' | 'in-progress' | 'completed' || 'waiting',
        startTime: sessionData?.start_time ? new Date(sessionData.start_time) : new Date(),
      };
      
      return { player, session };
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  },
  
  async getSession(sessionId: string): Promise<GameSession> {
    try {
      // Get session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      
      // Get all flags for the session
      const { data: flagsData, error: flagsError } = await supabase
        .from('flags')
        .select('*')
        .eq('session_id', sessionId);
      
      if (flagsError) throw flagsError;
      
      // Get all players for the session
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId);
      
      if (playersError) throw playersError;
      
      // Format data for the client
      const flags: Flag[] = flagsData.map(flag => ({
        id: flag.id,
        position: flag.position as Position,
        status: flag.status as 'available' | 'captured',
        capturedBy: flag.captured_by,
        capturedAt: flag.captured_at ? new Date(flag.captured_at) : undefined,
      }));
      
      const players: Player[] = playersData.map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        position: p.position as Position,
        score: p.score,
        status: p.status as 'active' | 'exited' | 'disconnected',
      }));
      
      const session: GameSession = {
        id: sessionId,
        settings: sessionData.settings as GameSettings,
        players,
        flags,
        status: sessionData.status as 'waiting' | 'in-progress' | 'completed',
        startTime: sessionData.start_time ? new Date(sessionData.start_time) : undefined,
        endTime: sessionData.end_time ? new Date(sessionData.end_time) : undefined,
      };
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  },
  
  async updatePlayerPosition(sessionId: string, playerId: string, position: Position): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ position })
        .eq('id', playerId)
        .eq('session_id', sessionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating player position:', error);
      throw error;
    }
  },
  
  async captureFlag(sessionId: string, playerId: string, flagId: string): Promise<void> {
    try {
      // Update flag status
      const { error: flagError } = await supabase
        .from('flags')
        .update({
          status: 'captured',
          captured_by: playerId,
          captured_at: new Date().toISOString(),
        })
        .eq('id', flagId)
        .eq('session_id', sessionId);
      
      if (flagError) throw flagError;
      
      // Increment player score
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('score')
        .eq('id', playerId)
        .eq('session_id', sessionId)
        .single();
      
      if (playerError) throw playerError;
      
      const { error: updateError } = await supabase
        .from('players')
        .update({ score: (playerData.score || 0) + 1 })
        .eq('id', playerId)
        .eq('session_id', sessionId);
      
      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error capturing flag:', error);
      throw error;
    }
  },
  
  async leaveSession(sessionId: string, playerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ status: 'exited' })
        .eq('id', playerId)
        .eq('session_id', sessionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error leaving session:', error);
      throw error;
    }
  },
  
  async endSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
        })
        .eq('id', sessionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },
  
  // Real-time subscriptions
  subscribeToSession(sessionId: string, callback: (session: GameSession) => void): () => void {
    // Subscribe to changes in the session
    const sessionSubscription = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      }, async (payload) => {
        // When session changes, fetch the full session data
        try {
          const session = await this.getSession(sessionId);
          callback(session);
        } catch (error) {
          console.error('Error fetching updated session:', error);
        }
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      sessionSubscription.unsubscribe();
    };
  },
  
  subscribeToPlayerUpdates(sessionId: string, callback: (players: Player[]) => void): () => void {
    // Subscribe to changes in players for this session
    const playersSubscription = supabase
      .channel(`players-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        // When players change, fetch all players for the session
        try {
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('session_id', sessionId);
          
          if (error) throw error;
          
          const players: Player[] = data.map(p => ({
            id: p.id,
            nickname: p.nickname,
            avatar: p.avatar,
            position: p.position as Position,
            score: p.score,
            status: p.status as 'active' | 'exited' | 'disconnected',
          }));
          
          callback(players);
        } catch (error) {
          console.error('Error fetching updated players:', error);
        }
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      playersSubscription.unsubscribe();
    };
  },
  
  subscribeToflagUpdates(sessionId: string, callback: (flags: Flag[]) => void): () => void {
    // Subscribe to changes in flags for this session
    const flagsSubscription = supabase
      .channel(`flags-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'flags',
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        // When flags change, fetch all flags for the session
        try {
          const { data, error } = await supabase
            .from('flags')
            .select('*')
            .eq('session_id', sessionId);
          
          if (error) throw error;
          
          const flags: Flag[] = data.map(flag => ({
            id: flag.id,
            position: flag.position as Position,
            status: flag.status as 'available' | 'captured',
            capturedBy: flag.captured_by,
            capturedAt: flag.captured_at ? new Date(flag.captured_at) : undefined,
          }));
          
          callback(flags);
        } catch (error) {
          console.error('Error fetching updated flags:', error);
        }
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      flagsSubscription.unsubscribe();
    };
  }
};