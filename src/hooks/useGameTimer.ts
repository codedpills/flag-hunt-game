import { useState, useEffect, useRef } from 'react';

interface UseGameTimerProps {
  duration?: number;
  autoStart?: boolean;
  onTimeUp?: () => void;
  sessionId?: string;
}

export const useGameTimer = ({ 
  duration = 300, 
  autoStart = true,
  onTimeUp,
  sessionId
}: UseGameTimerProps = {}) => {
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  
  // Use refs to keep track of the current state values without triggering re-renders
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef<number>(duration);
  const isRunningRef = useRef<boolean>(autoStart);
  const onTimeUpRef = useRef<(() => void) | undefined>(onTimeUp);
  
  // Update refs when state changes
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);
  
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Format time as MM:SS
  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  // Create timer implementation separate from React's render cycle
  const setupTimer = () => {
    // Clean up any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Create a new timer that works independently of React's render cycles
    timerRef.current = setInterval(() => {
      if (!isRunningRef.current) return;
      
      // Decrease time using the ref value to avoid stale closures
      timeLeftRef.current -= 1;
      
      // Manually update the state to reflect the change in the UI
      setTimeLeft(timeLeftRef.current);
      
      // Handle time up
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        
        // Update state
        setIsRunning(false);
        isRunningRef.current = false;
        
        // Call time up callback if provided
        if (onTimeUpRef.current) {
          onTimeUpRef.current();
        }
      }
    }, 1000);
    
    // Return cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  };

  // Start timer function
  const startTimer = () => {
    console.log(`⏰ Starting timer for ${timeLeftRef.current} seconds`);
    setIsRunning(true);
    isRunningRef.current = true;
  };

  // Pause timer function
  const pauseTimer = () => {
    console.log("⏰ Pausing timer");
    setIsRunning(false);
    isRunningRef.current = false;
  };

  // Reset timer function
  const resetTimer = (newDuration?: number) => {
    const resetValue = newDuration || duration;
    console.log(`⏰ Resetting timer to ${resetValue} seconds`);
    timeLeftRef.current = resetValue;
    setTimeLeft(resetValue);
  };

  // Setup timer once at initialization, independent of render cycles
  useEffect(() => {
    return setupTimer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once

  // When sessionId changes, reset the timer
  useEffect(() => {
    if (sessionId) {
      console.log(`⏰ Session ID changed to ${sessionId}, resetting timer`);
      resetTimer();
      if (autoStart) startTimer();
    }
  }, [sessionId, autoStart, duration]);

  return {
    timeLeft,
    formattedTime,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer
  };
};
