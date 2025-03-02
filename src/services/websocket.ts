import { useGameStore } from '../store/gameStore';
import { Position } from '../types/game';
import { api } from './api';
import { supabase } from '../lib/supabase';

// This service now uses Supabase Realtime instead of Socket.io
class WebSocketService {
  private sessionId: string | null = null;
  private playerId: string | null = null;
  private sessionSubscription: (() => void) | null = null;
  private playersSubscription: (() => void) | null = null;
  private flagsSubscription: (() => void) | null = null;
  private _isConnected: boolean = false;

  connect(sessionId: string, playerId: string) {
    if (this._isConnected) return;
    this.sessionId = sessionId;
    this.playerId = playerId;
    
    try {
      // Subscribe to session updates
      this.sessionSubscription = api.subscribeToSession(sessionId, (session) => {
        const { updateSession } = useGameStore.getState();
        updateSession(session);
      });
      
      // Subscribe to player updates
      this.playersSubscription = api.subscribeToPlayerUpdates(sessionId, (players) => {
        const { updatePlayers } = useGameStore.getState();
        updatePlayers(players);
      });
      
      // Subscribe to flag updates
      this.flagsSubscription = api.subscribeToflagUpdates(sessionId, (flags) => {
        const { updateFlags } = useGameStore.getState();
        updateFlags(flags);
      });
      
      this._isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error);
      return false;
    }
  }
  
  disconnect() {
    if (this.sessionSubscription) {
      this.sessionSubscription();
      this.sessionSubscription = null;
    }
    
    if (this.playersSubscription) {
      this.playersSubscription();
      this.playersSubscription = null;
    }
    
    if (this.flagsSubscription) {
      this.flagsSubscription();
      this.flagsSubscription = null;
    }
    
    this.sessionId = null;
    this.playerId = null;
    this._isConnected = false;
  }
  
  isConnected(): boolean {
    return this._isConnected;
  }
  
  // Methods to update data
  async updatePosition(position: Position) {
    if (!this.sessionId || !this.playerId) return;
    
    try {
      await api.updatePlayerPosition(this.sessionId, this.playerId, position);
    } catch (error) {
      console.error('Error updating position:', error);
    }
  }
  
  async captureFlag(flagId: string) {
    if (!this.sessionId || !this.playerId) return;
    
    try {
      await api.captureFlag(this.sessionId, this.playerId, flagId);
    } catch (error) {
      console.error('Error capturing flag:', error);
    }
  }
  
  async leaveGame() {
    if (!this.sessionId || !this.playerId) return;
    
    try {
      await api.leaveSession(this.sessionId, this.playerId);
      this.disconnect();
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }
  
  async startGame() {
    if (!this.sessionId) return;
    
    try {
      // Update session status to in-progress
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'in-progress',
          start_time: new Date().toISOString(),
        })
        .eq('id', this.sessionId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error starting game:', error);
    }
  }
}

// Create and export a singleton instance
export const webSocketService = new WebSocketService();