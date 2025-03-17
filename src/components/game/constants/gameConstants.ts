import { Position } from '../../../types/game';

// Required clicks based on difficulty
export const REQUIRED_CLICKS = {
  'easy': 1,
  'medium': 2,
  'hard': 3
};

// Glow effects configuration
export const GLOW_EFFECTS = {
  'easy': { color: 'rgba(0, 255, 0, 0.5)', radius: 15 },    // Green, easy to see
  'medium': { color: 'rgba(255, 215, 0, 0.4)', radius: 10 }, // Gold, moderate visibility
  'hard': { color: 'rgba(255, 255, 255, 0.3)', radius: 8 }  // White, harder to notice
};

// Avatar colors
export const FRUIT_COLORS: Record<string, string> = {
  apple: '#ff0000',
  orange: '#ff9900',
  banana: '#ffcc00',
  grape: '#9900cc',
  blueberry: '#0066ff',
  watermelon: '#ff3366',
  kiwi: '#99cc00',
  pineapple: '#ffcc33',
};

// Object type colors
export const OBJECT_COLORS = {
  house: '#e74c3c',
  playground: '#3498db',
  tree: '#2ecc71',
  pond: '#3498db',
  bench: '#f39c12'
};

// Audio URLs
export const AUDIO = {
  MOVE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  CAPTURE: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  COLLISION: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3',
};

// Game settings
export const SETTINGS = {
  PLAYER_RADIUS: 15,
  FLAG_CAPTURE_RADIUS: 100,
  MOVE_SPEED: 5,
  MOVE_INTERVAL: 50,
};

// Default grid size for maze
export const GRID_SIZE = 200;
export const MAZE_SIZE = 10;

// Types
export type MapObjectType = 'house' | 'playground' | 'tree' | 'pond' | 'bench';

export interface MapObject {
  id: string;
  type: MapObjectType;
  position: Position;
  size: { width: number; height: number };
  color: string;
  hasFlag?: boolean;
  flagId?: string;
  flagCaptured?: boolean;
}
