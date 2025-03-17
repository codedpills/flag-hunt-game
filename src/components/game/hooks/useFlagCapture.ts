import { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '../../../types/game';
import { REQUIRED_CLICKS, SETTINGS } from '../constants/gameConstants';

export function useFlagCapture(
  flags: any[], 
  difficulty: 'easy' | 'medium' | 'hard',
  onFlagCapture: (flagId: string) => void
) {
  const [clicksNeeded, setClicksNeeded] = useState<Map<string, number>>(new Map());
  const [flagCaptureAnimation, setFlagCaptureAnimation] = useState<{
    position: Position;
    timeLeft: number;
  } | null>(null);
  const [processedFlags] = useState<Set<string>>(new Set());
  const clicksInitializedRef = useRef(false);

  // Initialize clicks needed for each flag
  useEffect(() => {
    // Skip if no flags
    if (!flags?.length) return;
    
    // Only update clicks when difficulty changes or for new flags
    if (clicksInitializedRef.current && !flags.some(f => !clicksNeeded.has(f.id) && f.status === 'available')) {
      return;
    }
    
    console.log("Initializing clicks needed for flags");
    clicksInitializedRef.current = true;
    
    // Only update for available flags that don't have clicks assigned yet
    const newClicksNeeded = new Map(clicksNeeded);
    let needsUpdate = false;
    
    flags.forEach(flag => {
      if (flag.status === 'available' && !newClicksNeeded.has(flag.id)) {
        newClicksNeeded.set(flag.id, REQUIRED_CLICKS[difficulty]);
        needsUpdate = true;
      }
    });
    
    // Only update state if we actually have changes
    if (needsUpdate) {
      setClicksNeeded(newClicksNeeded);
    }
  }, [flags, difficulty, clicksNeeded]);

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

  const canCapture = useCallback((position: Position, objectPosition: Position): boolean => {
    const dx = objectPosition.x - position.x;
    const dy = objectPosition.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= SETTINGS.FLAG_CAPTURE_RADIUS;
  }, []);

  return {
    clicksNeeded,
    setClicksNeeded,
    flagCaptureAnimation,
    setFlagCaptureAnimation,
    processedFlags,
    canCapture
  };
}
