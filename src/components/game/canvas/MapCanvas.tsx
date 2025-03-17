import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Position } from '../../../types/game';
import { useMapObjects } from '../hooks/useMapObjects';
import { useCollision } from '../hooks/useCollision';
import { useFlagCapture } from '../hooks/useFlagCapture';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { useGameAudio } from '../hooks/useGameAudio';
import { 
  renderGrid, 
  renderMapObject, 
  renderFlag,
  renderPlayer,
  renderFlagCaptureAnimation
} from './renderFunctions';

interface MapCanvasProps {
  session: any;
  currentPlayer: any;
  playerPosition: Position;
  flags: any[];
  onFlagCapture: (flagId: string) => void;
  onMove: (position: Position) => void;
  onMazeRendered?: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  playerAvatar?: string;
  gameMode?: 'normal' | 'red-flag' | 'last-ones-out';
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
  soundEnabled,
  playerAvatar = 'orange',
  gameMode = 'normal'
}) => {
  if (!playerPosition) {
    console.error('Player position is undefined.');
    return null;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Use custom hooks
  const { mapObjects, setMapObjects, walls } = useMapObjects(playerPosition, flags, onMove);
  const { checkWallCollision, checkObjectCollision } = useCollision(walls, mapObjects);
  const { playMoveSound, playCaptureSound, playCollisionSound } = useGameAudio(soundEnabled);
  
  const { 
    clicksNeeded, 
    setClicksNeeded, 
    flagCaptureAnimation, 
    setFlagCaptureAnimation,
    processedFlags, 
    canCapture 
  } = useFlagCapture(flags, difficulty, onFlagCapture);
  
  const {
    targetPosition,
    moveToPosition,
  } = usePlayerMovement(
    playerPosition, 
    onMove, 
    checkWallCollision, 
    checkObjectCollision,
    playMoveSound,
    playCollisionSound
  );
  
  // Debug mount/unmount
  useEffect(() => {
    console.log("MapCanvas mounted");
    return () => console.log("MapCanvas unmounted");
  }, []);
  
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
    
    // Draw grid
    renderGrid(ctx, canvas.width, canvas.height, viewportOffsetX, viewportOffsetY);
    
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
        
        // Render the object
        renderMapObject(ctx, obj, objX, objY);
        
        // Draw flag indicator if object has a flag and it's not captured
        if (obj.hasFlag && !obj.flagCaptured) {
          // Find the flag
          const flag = flags?.find(f => f.id === obj.flagId);
          
          if (flag && flag.status === 'available') {
            const centerX = objX + obj.size.width / 2;
            const centerY = objY + obj.size.height / 2;
            renderFlag(ctx, centerX, centerY, flag, clicksNeeded, difficulty, gameMode);
          }
        }
      }
    });
    
    // Draw player character
    renderPlayer(ctx, canvas.width / 2, canvas.height / 2, playerAvatar);
    
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
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
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
      renderFlagCaptureAnimation(ctx, animX, animY, flagCaptureAnimation.timeLeft);
    }
    
  }, [
    canvasSize, 
    playerPosition, 
    flags, 
    gameMode, 
    walls, 
    mapObjects, 
    targetPosition, 
    flagCaptureAnimation, 
    playerAvatar,
    difficulty,
    clicksNeeded
  ]);
  
  // Handle mouse/touch interactions
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log("Canvas clicked");
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log("Screen click coordinates:", { x, y });
    console.log("Player position:", playerPosition);
    
    // Convert screen coordinates to world coordinates
    const worldX = playerPosition.x + (x - canvas.width / 2);
    const worldY = playerPosition.y + (y - canvas.height / 2);
    
    console.log("World click coordinates:", { worldX, worldY });
    
    // Check if clicked on a map object with a flag
    let flagClicked = false;
    
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
            // Add debug logs to see flag details
            console.log(`Clicked on flag ${flag.id}, clicks needed: ${clicksNeeded.get(flag.id)}`);
            
            // Calculate distance from player to flag
            const dx = obj.position.x - playerPosition.x;
            const dy = obj.position.y - playerPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only allow capture if player is close enough
            const captureRadius = 100;
            flagClicked = true;
            
            if (distance <= captureRadius) {
              // Get current clicks needed
              const currentClicks = clicksNeeded.get(flag.id) || 1;
              
              if (currentClicks <= 1) {
                // Final click - capture the flag
                onFlagCapture(flag.id);
                // Mark as processed to avoid double-capture
                processedFlags.add(flag.id);
                
                // Update map objects
                setMapObjects(prev => 
                  prev.map(o => 
                    o.id === obj.id 
                      ? { ...o, hasFlag: false, flagCaptured: true } 
                      : o
                  )
                );
                
                // Remove from clicks tracking
                const newClicksNeeded = new Map(clicksNeeded);
                newClicksNeeded.delete(flag.id);
                setClicksNeeded(newClicksNeeded);
                
                // Play capture sound
                playCaptureSound();
                
                // Show capture animation
                setFlagCaptureAnimation({
                  position: { x: obj.position.x + obj.size.width / 2, y: obj.position.y + obj.size.height / 2 },
                  timeLeft: 30
                });
              } else {
                // Decrement click count
                const newClicksNeeded = new Map(clicksNeeded);
                newClicksNeeded.set(flag.id, currentClicks - 1);
                setClicksNeeded(newClicksNeeded);
                
                // Play intermediate sound
                playMoveSound();
                
                // Show progress animation
                setFlagCaptureAnimation({
                  position: { x: obj.position.x + obj.size.width / 2, y: obj.position.y + obj.size.height / 2 },
                  timeLeft: 15
                });
              }
            } else {
              // Too far to capture
              playCollisionSound();
              
              // Show too far message
              setFlagCaptureAnimation({
                position: { x: obj.position.x + obj.size.width / 2, y: obj.position.y + obj.size.height / 2 },
                timeLeft: 15
              });
            }
            
            break; // Exit loop after handling flag
          }
        }
      }
    }
    
    // If no flag was clicked, handle movement
    if (!flagClicked) {
      const newTarget = { x: worldX, y: worldY };
      
      // Check if the target position is valid (no collision)
      const wallCollision = checkWallCollision(newTarget);
      const objectCollision = checkObjectCollision(newTarget);
      
      if (!wallCollision && !objectCollision) {
        moveToPosition(newTarget);
      } else {
        playCollisionSound();
      }
    }
  }, [
    playerPosition, 
    flags, 
    mapObjects,
    clicksNeeded, 
    processedFlags, 
    onFlagCapture,
    setMapObjects,
    setClicksNeeded,
    setFlagCaptureAnimation,
    checkWallCollision,
    checkObjectCollision,
    moveToPosition,
    playMoveSound,
    playCaptureSound,
    playCollisionSound
  ]);
  
  // Notify when maze is rendered
  useEffect(() => {
    if (onMazeRendered) {
      onMazeRendered();
    }
  }, [onMazeRendered]);

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleClick}
        tabIndex={0} // Make canvas focusable
        style={{ outline: 'none' }} // Remove focus outline
      />
      {/* Simple debug overlay */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 p-2 text-white text-xs rounded">
        <div>Flags: {flags?.length || 0} | Captured: {flags?.filter(f => f.status === 'captured').length || 0}</div>
      </div>
    </div>
  );
};

export default MapCanvas;
