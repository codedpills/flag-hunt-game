import React, { useEffect, useRef, useState, useCallback, MouseEvent } from 'react';
import { Position, Flag } from '../../types/game';

interface MapCanvasProps {
  session: any;
  currentPlayer: any;
  playerPosition: Position;
  flags: any[];
  onFlagCapture: (flagId: string) => void;
  onMove: (position: Position) => void;
  onMazeRendered?: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean; // Add this prop
  playerAvatar?: string; // Also add this prop for player rendering
  gameMode?: 'normal' | 'red-flag' | 'last-ones-out'; // Add this prop
}

// Map object types
type MapObjectType = 'house' | 'playground' | 'tree' | 'pond' | 'bench';

interface MapObject {
  id: string;
  type: MapObjectType;
  position: Position;
  size: { width: number; height: number };
  color: string;
  hasFlag?: boolean;
  flagId?: string;
  flagCaptured?: boolean;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  session,
  currentPlayer,
  playerPosition,
  flags,
  onFlagCapture,
  onMove,
  onMazeRendered,
  difficulty = 'medium',
  soundEnabled, // Destructure from props
  playerAvatar = 'orange', // Default avatar
  gameMode = 'normal' // Default to normal if not provided
}) => {
  if (!playerPosition) {
    console.error('Player position is undefined.');
    return;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mapObjects, setMapObjects] = useState<MapObject[]>([]);
  const [walls, setWalls] = useState<{ start: Position; end: Position }[]>([]);
  const [flagCaptureAnimation, setFlagCaptureAnimation] = useState<{
    position: Position;
    timeLeft: number;
  } | null>(null);
  const [processedFlags] = useState<Set<string>>(new Set());
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [objectsWithFlags, setObjectsWithFlags] = useState<Map<string, string>>(new Map());
  const [clicksNeeded, setClicksNeeded] = useState<Map<string, number>>(new Map());
  const [nearbyFlags, setNearbyFlags] = useState<string[]>([]);
  
  // Required clicks based on difficulty
  const requiredClicks = {
    'easy': 1,
    'medium': 2,
    'hard': 3
  };
  
  // Glow effects configuration
  const glowEffects = {
    'easy': { color: 'rgba(0, 255, 0, 0.5)', radius: 15 },    // Green, easy to see
    'medium': { color: 'rgba(255, 215, 0, 0.4)', radius: 10 }, // Gold, moderate visibility
    'hard': { color: 'rgba(255, 255, 255, 0.3)', radius: 8 }  // White, harder to notice
  };
  
  // Audio elements
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const captureAudioRef = useRef<HTMLAudioElement | null>(null);
  const collisionAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio elements
  useEffect(() => {
    moveAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    moveAudioRef.current.volume = 0.3;
    
    captureAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    captureAudioRef.current.volume = 0.5;
    
    collisionAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3');
    collisionAudioRef.current.volume = 0.3;
    
    return () => {
      if (moveAudioRef.current) {
        moveAudioRef.current.pause();
        moveAudioRef.current = null;
      }
      if (captureAudioRef.current) {
        captureAudioRef.current.pause();
        captureAudioRef.current = null;
      }
      if (collisionAudioRef.current) {
        collisionAudioRef.current.pause(); 
        collisionAudioRef.current = null;
      }
    };
  }, []);
  
  // Function to find a valid starting position
  const findValidStartPosition = (walls: { start: Position; end: Position }[], gridSize: number, mazeSize: number): Position => {
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
  };

  // Generate maze walls and map objects
  useEffect(() => {
    // Generate maze walls
    const mazeWalls: { start: Position; end: Position }[] = [];
    
    // Create a grid-based maze (simplified for demonstration)
    const gridSize = 200;
    const mazeSize = 10; // 10x10 grid
    
    // Generate horizontal walls
    for (let i = 0; i < mazeSize; i++) {
      for (let j = 0; j < mazeSize; j++) {
        // Add some randomness to create a maze-like structure
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

    // Set player's initial position to a valid starting point
    const startPosition = findValidStartPosition(mazeWalls, gridSize, mazeSize);
    onMove(startPosition);

    // Generate map objects
    const objects: MapObject[] = [];
    const objectTypes: MapObjectType[] = ['house', 'playground', 'tree', 'pond', 'bench'];
    const objectColors = {
      house: '#e74c3c',
      playground: '#3498db',
      tree: '#2ecc71',
      pond: '#3498db',
      bench: '#f39c12'
    };
    
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
        case 'house':
          width = 60;
          height = 60;
          break;
        case 'playground':
          width = 80;
          height = 80;
          break;
        case 'tree':
          width = 30;
          height = 30;
          break;
        case 'pond':
          width = 50;
          height = 50;
          break;
        case 'bench':
          width = 40;
          height = 20;
          break;
      }
      
      objects.push({
        id: `object-${i}`,
        type,
        position: { x, y },
        size: { width, height },
        color: objectColors[type],
        flagCaptured: false
      });
    }
    
    setMapObjects(objects);
  }, []);
  
  // Associate flags with map objects
  useEffect(() => {
    if (flags.length === 0 || mapObjects.length === 0) return;
    
    // Clone the map objects
    const updatedObjects = [...mapObjects];
    
    // Reset all objects' flag associations
    updatedObjects.forEach(obj => {
      obj.hasFlag = false;
      obj.flagId = undefined;
    });
    
    // Randomly assign flags to objects
    flags.forEach(flag => {
      if (flag.status === 'available') {
        // Find a random object that doesn't have a flag yet
        const availableObjects = updatedObjects.filter(obj => !obj.hasFlag && !obj.flagCaptured);
        
        if (availableObjects.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableObjects.length);
          const objectIndex = updatedObjects.findIndex(obj => obj.id === availableObjects[randomIndex].id);
          
          if (objectIndex !== -1) {
            updatedObjects[objectIndex].hasFlag = true;
            updatedObjects[objectIndex].flagId = flag.id;
          }
        }
      } else if (flag.status === 'captured') {
        // Mark objects with captured flags
        const objectWithFlag = updatedObjects.find(obj => obj.flagId === flag.id);
        if (objectWithFlag) {
          objectWithFlag.hasFlag = false;
          objectWithFlag.flagCaptured = true;
        }
      }
    });
    
    setMapObjects(updatedObjects);
  }, [flags, mapObjects]);

  // Replace the forced flag assignment with a cleaner version
  useEffect(() => {
    if (flags?.length > 0 && mapObjects.length > 0) {
      // Create a deep copy of map objects
      const updatedObjects = [...mapObjects];
      
      // Reset flag assignments
      updatedObjects.forEach(obj => {
        obj.hasFlag = false;
        obj.flagId = undefined;
      });
      
      // Assign available flags to random objects
      const availableFlags = flags.filter(f => f.status === 'available');
      const availableObjects = updatedObjects.filter(obj => !obj.flagCaptured);
      
      availableFlags.forEach(flag => {
        if (availableObjects.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableObjects.length);
          const selectedObj = availableObjects.splice(randomIndex, 1)[0];
          
          // Find this object in our updatedObjects array
          const objIndex = updatedObjects.findIndex(o => o.id === selectedObj.id);
          if (objIndex !== -1) {
            updatedObjects[objIndex].hasFlag = true;
            updatedObjects[objIndex].flagId = flag.id;
          }
        }
      });
      
      setMapObjects(updatedObjects);
    }
  }, [flags, mapObjects]);
  
  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        
        if (parent) {
          setCanvasSize({
            width: parent.clientWidth,
            height: parent.clientHeight,
          });
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Check if a position collides with a wall
  const checkWallCollision = useCallback((position: Position): boolean => {
    const playerRadius = 15; // Approximate player size
    
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
    const playerRadius = 15; // Approximate player size
    
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
  
  // Move player towards target position - using requestAnimationFrame instead of setInterval
  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);
  
  // Animation loop for player movement
  useEffect(() => {
    
    const movePlayer = (timestamp: number) => {
      if (!isMoving || !targetPosition) {
        return;
      }
      
      // Throttle to ~60fps
      if (timestamp - lastFrameTimeRef.current < 16) {
        animationFrameIdRef.current = requestAnimationFrame(movePlayer);
        return;
      }
      
      lastFrameTimeRef.current = timestamp;
      
      const dx = targetPosition.x - playerPosition.x;
      const dy = targetPosition.y - playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      
      const moveSpeed = 5;
      if (distance < moveSpeed) {
        onMove(targetPosition);
        setIsMoving(false);
        setTargetPosition(null);
        return;
      }
      
      // Calculate next position
      const ratio = moveSpeed / distance;
      const nextX = playerPosition.x + dx * ratio;
      const nextY = playerPosition.y + dy * ratio;
      const nextPosition = { x: nextX, y: nextY };
      
      
      // Check for collisions
      const wallCollision = checkWallCollision(nextPosition);
      const objectCollision = checkObjectCollision(nextPosition);
      
      if (!wallCollision && !objectCollision) {
        // Update position
        onMove(nextPosition);
        
        // Play movement sound occasionally (not on every frame)
        if (soundEnabled && Math.random() > 0.9 && moveAudioRef.current) {
          moveAudioRef.current.currentTime = 0;
          moveAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }
      } else {
        setIsMoving(false);
        setTargetPosition(null);
        
        // Play collision sound
        if (soundEnabled && collisionAudioRef.current) {
          collisionAudioRef.current.currentTime = 0;
          collisionAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }
        return;
      }
      
      // Continue animation
      animationFrameIdRef.current = requestAnimationFrame(movePlayer);
    };
    
    // Start animation loop if we're moving
    if (isMoving && targetPosition) {
      animationFrameIdRef.current = requestAnimationFrame(movePlayer);
    }
    
    return () => {
      // Clean up animation frame
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = 0; // Reset to known value
      }
    };
  }, [isMoving, targetPosition, playerPosition, onMove, checkWallCollision, checkObjectCollision, soundEnabled]);
  
  // Handle flag capture animation
  useEffect(() => {
    if (!flagCaptureAnimation) return;
    
    const animationInterval = setInterval(() => {
      setFlagCaptureAnimation(prev => {
        if (!prev) return null;
        
        if (prev.timeLeft <= 0) {
          return null;
        }
        
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1
        };
      });
    }, 50);
    
    return () => clearInterval(animationInterval);
  }, [flagCaptureAnimation]);
  
  // Draw the map and game elements
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background with a gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a2a6c');
    gradient.addColorStop(0.5, '#b21f1f');
    gradient.addColorStop(1, '#fdbb2d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate viewport offset to center on player
    const viewportOffsetX = playerPosition.x - canvas.width / 2;
    const viewportOffsetY = playerPosition.y - canvas.height / 2;
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    const offsetX = viewportOffsetX % gridSize;
    const offsetY = viewportOffsetY % gridSize;
    
    // Vertical lines
    for (let x = -offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = -offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw maze walls
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    walls.forEach(wall => {
      const startX = wall.start.x - viewportOffsetX;
      const startY = wall.start.y - viewportOffsetY;
      const endX = wall.end.x - viewportOffsetX;
      const endY = wall.end.y - viewportOffsetY;
      
      // Only draw walls that are visible on screen
      if ((startX >= -10 && startX <= canvas.width + 10) || 
          (endX >= -10 && endX <= canvas.width + 10)) {
        if ((startY >= -10 && startY <= canvas.height + 10) || 
            (endY >= -10 && endY <= canvas.height + 10)) {
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    });
    
    // Draw map objects
    mapObjects.forEach(obj => {
      const objX = obj.position.x - viewportOffsetX;
      const objY = obj.position.y - viewportOffsetY;
      
      // Only draw objects that are visible on screen
      if (objX + obj.size.width >= 0 && 
          objX <= canvas.width && 
          objY + obj.size.height >= 0 && 
          objY <= canvas.height) {
        
        // Draw the object based on its type
        ctx.fillStyle = obj.color;
        
        switch (obj.type) {
          case 'house':
            // House body
            ctx.fillRect(objX, objY, obj.size.width, obj.size.height);
            
            // Roof
            ctx.beginPath();
            ctx.moveTo(objX, objY);
            ctx.lineTo(objX + obj.size.width / 2, objY - 20);
            ctx.lineTo(objX + obj.size.width, objY);
            ctx.closePath();
            ctx.fill();
            
            // Door
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(objX + obj.size.width / 2 - 5, objY + obj.size.height - 20, 15, 20);
            
            // Window
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(objX + 10, objY + 15, 15, 15);
            ctx.fillRect(objX + obj.size.width - 25, objY + 15, 15, 15);
            break;
            
          case 'playground':
            // Main area
            ctx.fillStyle = '#8BC34A';
            ctx.fillRect(objX, objY, obj.size.width, obj.size.height);
            
            // Swing set
            ctx.fillStyle = '#795548';
            ctx.fillRect(objX + 10, objY + 20, 5, 30);
            ctx.fillRect(objX + 40, objY + 20, 5, 30);
            ctx.strokeStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(objX + 12, objY + 20);
            ctx.lineTo(objX + 25, objY + 40);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(objX + 43, objY + 20);
            ctx.lineTo(objX + 30, objY + 40);
            ctx.stroke();
            
            // Slide
            ctx.fillStyle = '#FF9800';
            ctx.fillRect(objX + obj.size.width - 30, objY + 15, 20, 50);
            break;
            
          case 'tree':
            // Trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(objX + obj.size.width / 2 - 5, objY + obj.size.height / 2, 10, obj.size.height / 2);
            
            // Leaves
            ctx.fillStyle = '#2E8B57';
            ctx.beginPath();
            ctx.arc(objX + obj.size.width / 2, objY + obj.size.height / 3, obj.size.width / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case 'pond':
            // Water
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.ellipse(objX + obj.size.width / 2, objY + obj.size.height / 2, 
                       obj.size.width / 2, obj.size.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Ripples
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(objX + obj.size.width / 2, objY + obj.size.height / 2, 
                       obj.size.width / 3, obj.size.height / 3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
          case 'bench':
            // Bench seat
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(objX, objY, obj.size.width, 8);
            
            // Bench legs
            ctx.fillRect(objX + 5, objY + 8, 5, 12);
            ctx.fillRect(objX + obj.size.width - 10, objY + 8, 5, 12);
            break;
            
          default:
            ctx.fillRect(objX, objY, obj.size.width, obj.size.height);
        }
        
        // Draw flag indicator if object has a flag and it's not captured
        if (obj.hasFlag && !obj.flagCaptured) {
          // Find the flag
          const flag = flags?.find(f => f.id === obj.flagId);
          
          if (flag && flag.status === 'available') {
            // Draw a subtle glow based on difficulty
            ctx.shadowBlur = glowEffects[difficulty].radius;
            ctx.shadowColor = glowEffects[difficulty].color;
            ctx.fillStyle = gameMode === 'red-flag' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(objX + obj.size.width / 2, objY + obj.size.height / 2, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Draw flag icon
            ctx.fillStyle = gameMode === 'red-flag' ? '#ff0000' : '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(objX + obj.size.width / 2 - 5, objY + obj.size.height / 2 - 15);
            ctx.lineTo(objX + obj.size.width / 2 + 10, objY + obj.size.height / 2 - 8);
            ctx.lineTo(objX + obj.size.width / 2 - 5, objY + obj.size.height / 2 - 2);
            ctx.lineTo(objX + obj.size.width / 2 - 5, objY + obj.size.height / 2 + 10);
            ctx.closePath();
            ctx.fill();
            
            // Draw flag pole
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(objX + obj.size.width / 2 - 5, objY + obj.size.height / 2 - 15);
            ctx.lineTo(objX + obj.size.width / 2 - 5, objY + obj.size.height / 2 + 15);
            ctx.stroke();
          }
        }
      }
    });
    
    // Map avatar string to fruit colors
    const fruitColors: Record<string, string> = {
      apple: '#ff0000',
      orange: '#ff9900',
      banana: '#ffcc00',
      grape: '#9900cc',
      blueberry: '#0066ff',
      watermelon: '#ff3366',
      kiwi: '#99cc00',
      pineapple: '#ffcc33',
    };
    
    // Draw player character (stick figure with fruit head)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const headSize = 20;
    const color = fruitColors[playerAvatar] || '#ff9900';
    
    
    // Draw head based on avatar
    switch (playerAvatar) {
      case 'apple':
        // Apple head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Apple stem
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(centerX - 1, centerY - 27, 2, 4);
        
        // Apple leaf
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY - 26, 4, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'banana':
        // Banana head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 15, 12, 8, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'grape':
        // Grape cluster
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX - 3, centerY - 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 3, centerY - 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY - 13, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'watermelon':
        // Watermelon head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 15, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stripes
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - 15);
        ctx.lineTo(centerX + 10, centerY - 15);
        ctx.stroke();
        break;
        
      case 'blueberry':
        // Blueberry head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Blueberry top
        ctx.fillStyle = '#663399';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 23, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'kiwi':
        // Kiwi head (brown outside)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(centerX, centerY - 15, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Green inside
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 15, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Seeds
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - 2, centerY - 17, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 3, centerY - 15, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX - 1, centerY - 12, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'pineapple':
        // Pineapple head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 15, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pineapple pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        for (let i = -10; i <= 10; i += 4) {
          ctx.beginPath();
          ctx.moveTo(centerX - 8, centerY - 15 + i);
          ctx.lineTo(centerX + 8, centerY - 15 + i);
          ctx.stroke();
        }
        
        // Pineapple leaves
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 27);
        ctx.lineTo(centerX - 5, centerY - 22);
        ctx.lineTo(centerX, centerY - 20);
        ctx.lineTo(centerX + 5, centerY - 22);
        ctx.closePath();
        ctx.fill();
        break;
        
      default:
        // Default orange head
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY - 15, 10, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw body (line)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 5);
    ctx.lineTo(centerX, centerY + 15);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw arms
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.stroke();
    
    // Draw legs
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 15);
    ctx.lineTo(centerX - 7, centerY + 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + 15);
    ctx.lineTo(centerX + 7, centerY + 30);
    ctx.stroke();
    
    // Draw exit door for Last Ones Out mode
    if (gameMode === 'last-ones-out') {
      // This would be positioned at a specific location in the real game
      const doorX = 1900 - viewportOffsetX;
      const doorY = 1900 - viewportOffsetY;
      
      if (doorX > -50 && doorX < canvas.width + 50 &&
          doorY > -50 && doorY < canvas.height + 50) {
        ctx.fillStyle = '#8b4513'; // Brown door
        ctx.fillRect(doorX - 15, doorY - 25, 30, 50);
        
        // Door knob
        ctx.beginPath();
        ctx.arc(doorX + 8, doorY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
      }
    }
    
    // Draw target position indicator if moving
    if (targetPosition) {
      const targetX = targetPosition.x - viewportOffsetX;
      const targetY = targetPosition.y - viewportOffsetY;
      
      ctx.beginPath();
      ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fill();
      
      // Draw path line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw flag capture animation
    if (flagCaptureAnimation) {
      const animX = flagCaptureAnimation.position.x - viewportOffsetX;
      const animY = flagCaptureAnimation.position.y - viewportOffsetY;
      
      // Draw expanding circle
      const radius = 30 - flagCaptureAnimation.timeLeft;
      ctx.beginPath();
      ctx.arc(animX, animY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${flagCaptureAnimation.timeLeft / 30})`;
      ctx.fill();
      
      // Draw flag icon
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.moveTo(animX - 5, animY - 15);
      ctx.lineTo(animX + 10, animY - 10);
      ctx.lineTo(animX - 5, animY - 5);
      ctx.lineTo(animX - 5, animY + 15);
      ctx.closePath();
      ctx.fill();
      
      // Draw pole
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(animX - 5, animY - 15);
      ctx.lineTo(animX - 5, animY + 15);
      ctx.stroke();
      
      // Draw text
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('Flag Captured!', animX, animY + 35);
    }
    
  }, [canvasSize, playerPosition, flags, gameMode, walls, mapObjects, targetPosition, flagCaptureAnimation, playerAvatar]);
  
  
  // Handle keyboard movement with debouncing to prevent too many updates
  useEffect(() => {
    
    // Track pressed keys to allow multiple key presses
    const pressedKeys = new Set<string>();
    let lastMoveTime = 0;
    const moveInterval = 50; // Limit movement updates to every 50ms
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys and WASD to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
        pressedKeys.add(e.key.toLowerCase());
        processMovement();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        pressedKeys.delete(e.key.toLowerCase());
      }
    };
    
    const processMovement = () => {
      const now = Date.now();
      if (now - lastMoveTime < moveInterval) {
        return; // Throttle updates
      }
      lastMoveTime = now;
      
      // Don't process if we're already moving to a target
      if (isMoving && targetPosition) {
        return;
      }
      
      const moveSpeed = 10;
      let newPosition = { ...playerPosition };
      let moved = false;
      
      // Process all currently pressed keys
      if (pressedKeys.has('w') || pressedKeys.has('arrowup')) {
        newPosition.y -= moveSpeed;
        moved = true;
      }
      if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) {
        newPosition.y += moveSpeed;
        moved = true;
      }
      if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) {
        newPosition.x -= moveSpeed;
        moved = true;
      }
      if (pressedKeys.has('d') || pressedKeys.has('arrowright')) {
        newPosition.x += moveSpeed;
        moved = true;
      }
      
      if (moved) {
        const wallCollision = checkWallCollision(newPosition);
        const objectCollision = checkObjectCollision(newPosition);
        
        // Check for collisions
        if (!wallCollision && !objectCollision) {
          onMove(newPosition);
          
          // Play movement sound occasionally
          if (soundEnabled && Math.random() > 0.7 && moveAudioRef.current) {
            moveAudioRef.current.currentTime = 0;
            moveAudioRef.current.play().catch(e => console.log("Audio play error:", e));
          }
          
          // Schedule the next movement if keys are still pressed
          if (pressedKeys.size > 0) {
            setTimeout(processMovement, moveInterval);
          }
        } else {
          if (soundEnabled && collisionAudioRef.current) {
            // Play collision sound
            collisionAudioRef.current.currentTime = 0;
            collisionAudioRef.current.play().catch(e => console.log("Audio play error:", e));
          }
        }
      }
    };
    
    // Add event listeners to document
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Focus the canvas to ensure it receives keyboard events
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      pressedKeys.clear();
    };
  }, [playerPosition, onMove, checkWallCollision, checkObjectCollision, soundEnabled, isMoving, targetPosition]);
  
  // Handle mouse/touch interactions
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert screen coordinates to world coordinates
    const worldX = playerPosition.x + (x - canvas.width / 2);
    const worldY = playerPosition.y + (y - canvas.height / 2);
    
    // Check if clicked on a map object with a flag
    let flagCaptured = false;
    
    for (const obj of mapObjects) {
      if (obj.hasFlag && !obj.flagCaptured) {
        // Convert object position to screen coordinates
        const objScreenX = obj.position.x - (playerPosition.x - canvas.width / 2);
        const objScreenY = obj.position.y - (playerPosition.y - canvas.height / 2);
        
        // Check if click is within object bounds
        if (
          x >= objScreenX && 
          x <= objScreenX + obj.size.width && 
          y >= objScreenY && 
          y <= objScreenY + obj.size.height
        ) {
          // Find the flag
          const flag = flags.find(f => f.id === obj.flagId);
          
          if (flag && flag.status === 'available' && !processedFlags.has(flag.id)) {
            // Calculate distance from player to flag
            const dx = obj.position.x - playerPosition.x;
            const dy = obj.position.y - playerPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only allow capture if player is close enough (within 100 units)
            const captureRadius = 100;
            
            if (distance <= captureRadius) {
              // Call the flag capture callback
              onFlagCapture(flag.id);
              processedFlags.add(flag.id);
              flagCaptured = true;
              
              // Update map objects
              setMapObjects(prev => 
                prev.map(o => 
                  o.id === obj.id 
                    ? { ...o, hasFlag: false, flagCaptured: true } 
                    : o
                )
              );
              
              // Play capture sound
              if (soundEnabled && captureAudioRef.current) {
                captureAudioRef.current.currentTime = 0;
                captureAudioRef.current.play().catch(e => console.log("Audio play error:", e));
              }
              
              // Show capture animation
              setFlagCaptureAnimation({
                position: { x: obj.position.x + obj.size.width / 2, y: obj.position.y + obj.size.height / 2 },
                timeLeft: 30
              });
            } else {
              // Play "too far" sound or show a message
              if (soundEnabled && collisionAudioRef.current) {
                collisionAudioRef.current.currentTime = 0;
                collisionAudioRef.current.play().catch(e => console.log("Audio play error:", e));
              }
              
              // Show "too far" message
              setFlagCaptureAnimation({
                position: { x: obj.position.x + obj.size.width / 2, y: obj.position.y + obj.size.height / 2 },
                timeLeft: 15
              });
            }
            
            break; // Exit the loop after attempting to capture a flag
          }
        }
      }
    }
    
    // If no flag was captured, set target position for movement
    if (!flagCaptured) {
      const newTarget = { x: worldX, y: worldY };
      
      // Check if the target position is valid (no collision)
      const wallCollision = checkWallCollision(newTarget);
      const objectCollision = checkObjectCollision(newTarget);
      
      if (!wallCollision && !objectCollision) {
        // Cancel any existing movement
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        
        setTargetPosition(newTarget);
        setIsMoving(true);
        
        // Force a direct move if very close
        const dx = newTarget.x - playerPosition.x;
        const dy = newTarget.y - playerPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          onMove(newTarget);
          setIsMoving(false);
        }
      } else {
        if (soundEnabled && collisionAudioRef.current) {
          // Play collision sound if target is invalid
          collisionAudioRef.current.currentTime = 0;
          collisionAudioRef.current.play().catch(e => console.log("Audio play error:", e));
        }
      }
    }
  }, [canvasRef, playerPosition, mapObjects, flags, processedFlags, onFlagCapture, soundEnabled, checkWallCollision, checkObjectCollision]);
  
  // Add tabIndex to make canvas focusable for keyboard events
  useEffect(() => {
    if (onMazeRendered) {  // Change onRendered to onMazeRendered
      onMazeRendered();
    }
  }, [onMazeRendered]);  // Change dependency as well

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleClick}
        tabIndex={0} // Make canvas focusable
        style={{ outline: 'none' }} // Remove focus outline
      />
      {/* Remove or simplify debug overlay - just keep minimal info */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 p-2 text-white text-xs rounded">
        <div>Flags: {flags?.length || 0} | Captured: {flags?.filter(f => f.status === 'captured').length || 0}</div>
      </div>
    </div>
  );
};

export default MapCanvas;