export type GameMode = 'normal' | 'red-flag' | 'last-ones-out';

export interface GameSettings {
  gameMode: GameMode;
  playerCount: number;
  duration: number; // in seconds
  flagCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  position: Position;
  score: number;
  status: 'active' | 'exited' | 'disconnected';
}

export interface Position {
  x: number;
  y: number;
}

export interface Flag {
  id: string;
  position: Position;
  status: 'available' | 'captured';
  capturedBy?: string;
  capturedAt?: Date;
}

export interface GameSession {
  id: string;
  settings: GameSettings;
  players: Player[];
  flags: Flag[];
  startTime?: Date;
  endTime?: Date;
  status: 'waiting' | 'in-progress' | 'completed';
  mazeLayout: number[][];
}