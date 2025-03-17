import { useState, useEffect } from 'react';
import { Position } from '../../../types/game';
import { MapObject, MapObjectType, OBJECT_COLORS, GRID_SIZE, MAZE_SIZE } from '../constants/gameConstants';

export function useMapObjects(
  initialPosition: Position | null, 
  flags: any[],
  onMove: (position: Position) => void
) {
  const [mapObjects, setMapObjects] = useState<MapObject[]>([]);
  const [walls, setWalls] = useState<{ start: Position; end: Position }[]>([]);

  // Initialize walls and objects
  useEffect(() => {
    // Generate maze walls
    const mazeWalls: { start: Position; end: Position }[] = [];
    
    // Create a grid-based maze
    const gridSize = GRID_SIZE;
    const mazeSize = MAZE_SIZE;
    
    // Generate walls with randomness
    for (let i = 0; i < mazeSize; i++) {
      for (let j = 0; j < mazeSize; j++) {
        if (Math.random() > 0.7) {
          mazeWalls.push({
            start: { x: i * gridSize, y: j * gridSize },
            end: { x: (i + 1) * gridSize, y: j * gridSize }
          });
        }
        
        if (Math.random() > 0.7) {
          mazeWalls.push({
            start: { x: i * gridSize, y: j * gridSize },
            end: { x: i * gridSize, y: (j + 1) * gridSize }
          });
        }
      }
    }
    
    // Add outer walls
    for (let i = 0; i <= mazeSize; i++) {
      // Top and bottom walls
      mazeWalls.push({
        start: { x: i * gridSize, y: 0 },
        end: { x: (i + 1) * gridSize, y: 0 }
      });
      
      mazeWalls.push({
        start: { x: i * gridSize, y: mazeSize * gridSize },
        end: { x: (i + 1) * gridSize, y: mazeSize * gridSize }
      });
      
      // Left and right walls
      mazeWalls.push({
        start: { x: 0, y: i * gridSize },
        end: { x: 0, y: (i + 1) * gridSize }
      });
      
      mazeWalls.push({
        start: { x: mazeSize * gridSize, y: i * gridSize },
        end: { x: mazeSize * gridSize, y: (i + 1) * gridSize }
      });
    }
    
    setWalls(mazeWalls);

    // Find a valid starting position
    const startPosition = findValidStartPosition(mazeWalls, gridSize, mazeSize);
    if (onMove) onMove(startPosition);

    // Generate map objects
    const objects: MapObject[] = [];
    const objectTypes: MapObjectType[] = ['house', 'playground', 'tree', 'pond', 'bench'];
    
    // Place objects in the maze
    for (let i = 0; i < 30; i++) {
      const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      const x = Math.floor(Math.random() * (mazeSize * gridSize - 50));
      const y = Math.floor(Math.random() * (mazeSize * gridSize - 50));
      
      // Ensure objects don't spawn in the starting area
      if (Math.abs(x - startPosition.x) < 100 && Math.abs(y - startPosition.y) < 100) continue;

      // Determine size based on type
      let width = 30;
      let height = 30;
      
      switch (type) {
        case 'house': width = 60; height = 60; break;
        case 'playground': width = 80; height = 80; break;
        case 'tree': width = 30; height = 30; break;
        case 'pond': width = 50; height = 50; break;
        case 'bench': width = 40; height = 20; break;
      }
      
      objects.push({
        id: `object-${i}`,
        type,
        position: { x, y },
        size: { width, height },
        color: OBJECT_COLORS[type],
        flagCaptured: false
      });
    }
    
    setMapObjects(objects);
  }, [onMove]);
  
  // Handle flag assignment
  useEffect(() => {
    // Skip if no flags or objects
    if (!flags?.length || !mapObjects.length) return;
    
    console.log("Updating flag assignments, available flags:", 
      flags.filter(f => f.status === 'available').length);
    
    // Create a deep copy of map objects
    const updatedObjects = [...mapObjects];
    
    // Reset all objects' flag associations but keep the flagCaptured state
    updatedObjects.forEach(obj => {
      if (!obj.flagCaptured) {
        obj.hasFlag = false;
        obj.flagId = undefined;
      }
    });
    
    // Mark objects with captured flags
    flags.filter(f => f.status === 'captured').forEach(flag => {
      const objWithFlag = updatedObjects.find(obj => obj.flagId === flag.id);
      if (objWithFlag) {
        objWithFlag.hasFlag = false;
        objWithFlag.flagCaptured = true;
      }
    });
    
    // Assign available flags to random objects
    const availableFlags = flags.filter(f => f.status === 'available');
    const availableObjects = updatedObjects.filter(obj => !obj.hasFlag && !obj.flagCaptured);
    
    if (availableFlags.length > 0 && availableObjects.length > 0) {
      console.log(`Assigning ${availableFlags.length} flags to map objects`);
      
      // Create a copy to avoid modifying while iterating
      const objectsToAssign = [...availableObjects];
      
      availableFlags.forEach(flag => {
        if (objectsToAssign.length > 0) {
          // Select a random object
          const randomIndex = Math.floor(Math.random() * objectsToAssign.length);
          const selectedObj = objectsToAssign.splice(randomIndex, 1)[0];
          
          // Find this object in our updatedObjects array
          const objIndex = updatedObjects.findIndex(o => o.id === selectedObj.id);
          if (objIndex !== -1) {
            console.log(`Assigning flag ${flag.id} to object ${selectedObj.id}`);
            updatedObjects[objIndex].hasFlag = true;
            updatedObjects[objIndex].flagId = flag.id;
          }
        }
      });
      
      setMapObjects(updatedObjects);
    } else {
      console.log("No available flags or objects to assign");
    }
  }, [flags, mapObjects]);

  // Helper functions
  function findValidStartPosition(walls: { start: Position; end: Position }[], gridSize: number, mazeSize: number): Position {
    const cellSize = gridSize / 2;
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * mazeSize) * gridSize + cellSize;
      const y = Math.floor(Math.random() * mazeSize) * gridSize + cellSize;

      // Check if position is clear of walls
      const isClear = walls.every(wall => {
        const minX = Math.min(wall.start.x, wall.end.x);
        const maxX = Math.max(wall.start.x, wall.end.x);
        const minY = Math.min(wall.start.y, wall.end.y);
        const maxY = Math.max(wall.start.y, wall.end.y);

        return !(x >= minX && x <= maxX && y >= minY && y <= maxY);
      });

      if (isClear) {
        return { x, y };
      }

      attempts++;
    }

    // Fallback to center position if no valid position found
    return {
      x: (mazeSize / 2) * gridSize,
      y: (mazeSize / 2) * gridSize
    };
  }

  return { mapObjects, setMapObjects, walls };
}
