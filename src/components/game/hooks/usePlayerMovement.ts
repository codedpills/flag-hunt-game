import { useState, useRef, useEffect, useCallback } from 'react';
import { Position } from '../../../types/game';
import { SETTINGS } from '../constants/gameConstants';

export function usePlayerMovement(
  playerPosition: Position,
  onMove: (position: Position) => void,
  checkWallCollision: (position: Position) => boolean,
  checkObjectCollision: (position: Position) => boolean,
  playMoveSound: () => void,
  playCollisionSound: () => void
) {
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [isMoving, setIsMoving] = useState(false);
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
      
      const moveSpeed = SETTINGS.MOVE_SPEED;
      if (distance < moveSpeed) {
        onMove(targetPosition);
        setIsMoving(false);
        setTargetPosition(null);
        return;
      }
      
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
        
        // Play movement sound occasionally
        if (Math.random() > 0.9) {
          playMoveSound();
        }
      } else {
        setIsMoving(false);
        setTargetPosition(null);
        playCollisionSound();
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
      }
    };
  }, [isMoving, targetPosition, playerPosition, onMove, checkWallCollision, checkObjectCollision, playMoveSound, playCollisionSound]);

  // Handle keyboard movement
  useEffect(() => {
    const pressedKeys = new Set<string>();
    let lastMoveTime = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
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
      if (now - lastMoveTime < SETTINGS.MOVE_INTERVAL) {
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
        
        if (!wallCollision && !objectCollision) {
          onMove(newPosition);
          
          // Play movement sound occasionally
          if (Math.random() > 0.7) {
            playMoveSound();
          }
          
          // Schedule the next movement if keys are still pressed
          if (pressedKeys.size > 0) {
            setTimeout(processMovement, SETTINGS.MOVE_INTERVAL);
          }
        } else {
          playCollisionSound();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      pressedKeys.clear();
    };
  }, [playerPosition, onMove, checkWallCollision, checkObjectCollision, isMoving, targetPosition, playMoveSound, playCollisionSound]);

  // Move to a target position
  const moveToPosition = useCallback((position: Position) => {
    // Cancel any existing movement
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    setTargetPosition(position);
    setIsMoving(true);
  }, []);

  return {
    targetPosition,
    isMoving,
    moveToPosition,
    setTargetPosition,
    setIsMoving
  };
}
