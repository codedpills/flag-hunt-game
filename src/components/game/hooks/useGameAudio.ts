import { useRef, useEffect } from 'react';
import { AUDIO } from '../constants/gameConstants';

export function useGameAudio(soundEnabled: boolean) {
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const captureAudioRef = useRef<HTMLAudioElement | null>(null);
  const collisionAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio elements
  useEffect(() => {
    moveAudioRef.current = new Audio(AUDIO.MOVE);
    moveAudioRef.current.volume = 0.3;
    
    captureAudioRef.current = new Audio(AUDIO.CAPTURE);
    captureAudioRef.current.volume = 0.5;
    
    collisionAudioRef.current = new Audio(AUDIO.COLLISION);
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

  // Play sound functions
  const playMoveSound = () => {
    if (soundEnabled && moveAudioRef.current) {
      moveAudioRef.current.currentTime = 0;
      moveAudioRef.current.play().catch(e => console.log("Audio play error:", e));
    }
  };
  
  const playCaptureSound = () => {
    if (soundEnabled && captureAudioRef.current) {
      captureAudioRef.current.currentTime = 0;
      captureAudioRef.current.play().catch(e => console.log("Audio play error:", e));
    }
  };
  
  const playCollisionSound = () => {
    if (soundEnabled && collisionAudioRef.current) {
      collisionAudioRef.current.currentTime = 0;
      collisionAudioRef.current.play().catch(e => console.log("Audio play error:", e));
    }
  };

  return {
    playMoveSound,
    playCaptureSound,
    playCollisionSound
  };
}
