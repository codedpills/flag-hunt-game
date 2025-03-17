import { useCallback } from 'react';
import { Position } from '../../../types/game';
import { MapObject, SETTINGS } from '../constants/gameConstants';

export function useCollision(
  walls: { start: Position; end: Position }[],
  mapObjects: MapObject[]
) {
  // Check if a position collides with a wall
  const checkWallCollision = useCallback((position: Position): boolean => {
    const playerRadius = SETTINGS.PLAYER_RADIUS;
    
    for (const wall of walls) {
      // Line-circle collision detection
      const x1 = wall.start.x;
      const y1 = wall.start.y;
      const x2 = wall.end.x;
      const y2 = wall.end.y;
      
      // Check if wall is horizontal or vertical
      if (x1 === x2) { // Vertical wall
        if (Math.abs(position.x - x1) < playerRadius && 
            position.y >= Math.min(y1, y2) - playerRadius && 
            position.y <= Math.max(y1, y2) + playerRadius) {
          return true;
        }
      } else if (y1 === y2) { // Horizontal wall
        if (Math.abs(position.y - y1) < playerRadius && 
            position.x >= Math.min(x1, x2) - playerRadius && 
            position.x <= Math.max(x1, x2) + playerRadius) {
          return true;
        }
      }
    }
    
    return false;
  }, [walls]);
  
  // Check if a position collides with a map object
  const checkObjectCollision = useCallback((position: Position): boolean => {
    const playerRadius = SETTINGS.PLAYER_RADIUS;
    
    for (const obj of mapObjects) {
      // Simple rectangular collision detection
      if (
        position.x + playerRadius > obj.position.x &&
        position.x - playerRadius < obj.position.x + obj.size.width &&
        position.y + playerRadius > obj.position.y &&
        position.y - playerRadius < obj.position.y + obj.size.height
      ) {
        return true;
      }
    }
    
    return false;
  }, [mapObjects]);

  return {
    checkWallCollision,
    checkObjectCollision
  };
}
