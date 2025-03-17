import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useSessionManager } from '../hooks/useSessionManager';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameSound } from '../hooks/useGameSound';
import { Position } from '../types/game';
import { webSocketService } from '../services/websocket'; // Add this import
import { LoadingScreen, PlayerErrorScreen, PlayerLoadingScreen } from '../components/game/LoadingScreens';
import GameHeader from '../components/game/GameHeader';
import GameContent from '../components/game/GameContent';
import GameLeaderboard from '../components/game/GameLeaderboard';
import GameOverModal from '../components/game/GameOverModal'; // Add this import

const Game: React.FC = () => {
  const navigate = useNavigate();
  const { 
    session, 
    currentPlayer, 
    updatePlayerPosition, 
    captureFlag, 
    leaveSession, 
    setError, 
    updateSession // Add this
  } = useGameStore();
  const { session: sessionFromManager, startSessionTimer, getSession } = useSessionManager();
  
  // State for UI components
  const [isGameOver, setIsGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [capturedFlagsCount, setCapturedFlagsCount] = useState(0);
  const [flags, setFlags] = useState([]);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playerCreationAttempted, setPlayerCreationAttempted] = useState(false);
  const [playerCreationError, setPlayerCreationError] = useState(false);
  const [isMazeRendered, setIsMazeRendered] = useState(false);

  // Custom hooks
  const { 
    soundEnabled, 
    toggleSound, 
    playSound, 
    playFlagCaptureSound, // Add this function to destructuring
    initBackgroundMusic, 
    stopBackgroundMusic 
  } = useGameSound();
  
  // FIX: Don't multiply by 60 here since the duration is already in seconds
  const { timeLeft, formattedTime } = useGameTimer({
    duration: session?.settings?.duration || 300, // Don't multiply by 60
    onTimeUp: () => setIsGameOver(true),
    sessionId: session?.id
  });

  // Initialize background music when maze is rendered
  useEffect(() => {
    if (isMazeRendered) {
      initBackgroundMusic();
    }
  }, [isMazeRendered, initBackgroundMusic]);

  // Load session data when component mounts
  useEffect(() => {
    const playerName = localStorage.getItem('player');
    const avatar = localStorage.getItem('avatar');
    const sessionId = localStorage.getItem('sessionId');

    if (!playerName || !avatar || !sessionId) {
      navigate('/');
      return;
    }

    if (!session && sessionId) {
      setIsLoading(true);
      setLoadError(null);

      getSession(sessionId)
        .then(loadedSession => {
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load session:', error);
          setLoadError(error.message || 'Failed to load game session');
          setIsLoading(false);
          setTimeout(() => navigate('/'), 3000);
        });
    } else {
      setIsLoading(false);
    }
  }, [session, navigate, getSession]);

  // Handle player creation
  useEffect(() => {
    if (session && !currentPlayer && !playerCreationAttempted) {
      setPlayerCreationAttempted(true);

      const playerName = localStorage.getItem('player');
      const avatar = localStorage.getItem('avatar');

      if (playerName && avatar) {
        const tempPlayer = {
          id: `player-${Date.now()}`,
          nickname: playerName,
          avatar: avatar,
          position: { x: 0, y: 0 },
          score: 0,
          status: 'active' as const
        };

        useGameStore.getState().setCurrentPlayer(tempPlayer);
        useGameStore.getState().updateSession({
          ...session,
          players: [...(session.players || []), tempPlayer]
        });
      } else {
        console.error('No player data in localStorage');
        setPlayerCreationError(true);
      }
    }
  }, [session, currentPlayer, playerCreationAttempted]);

  // Initialize flags when session is loaded
  useEffect(() => {
    if (session?.flags) {
      setFlags(session.flags);
    }
  }, [session]);

  // Add debug logging for the flags state
  // Add this after the flags initialization
  useEffect(() => {
    if (session?.flags) {
      console.log("Game received flags:", session.flags);
      setFlags(session.flags);
    }
  }, [session]);

  // Replace the problematic test flags effect with this fixed version
  useEffect(() => {
    // Only run this once when session is first loaded
    if (session && (!session.flags || session.flags.length === 0)) {
      console.log("Adding test flags to session for debugging");
      
      const testFlags = [
        { id: 'flag-1', status: 'available' },
        { id: 'flag-2', status: 'available' },
        { id: 'flag-3', status: 'available' }
      ];
      
      // Only update local state, not the store directly
      setFlags(testFlags);
      
      // Update the session through the proper updateSession action
      updateSession({
        ...session,
        flags: testFlags
      });
    } else if (session?.flags) {
      console.log(`Session has ${session.flags.length} flags`);
    }
  }, [session, updateSession]);

  // Fix the flag structure validation effect - remove direct store access
  useEffect(() => {
    // Skip if no flags
    if (!flags || flags.length === 0) return;

    // Validate flag structure without using refs
    const invalidFlags = flags.some(flag => 
      !flag || 
      typeof flag.id !== 'string' || 
      typeof flag.status !== 'string'
    );
    
    if (invalidFlags) {
      console.error("⚠️ FLAG DATA ISSUE! Some flags have invalid structure:", flags);
      
      // Create proper flags
      const fixedFlags = flags.map((flag, index) => {
        if (!flag || typeof flag.id !== 'string' || typeof flag.status !== 'string') {
          return { id: `flag-${index}`, status: 'available' };
        }
        return flag;
      });
      
      console.log("Fixed flags:", fixedFlags);
      setFlags(fixedFlags);
      
      // Update session with fixed flags via the proper action method
      if (session) {
        updateSession({
          ...session,
          flags: fixedFlags
        });
      }
    }
  }, [flags, session, updateSession]);

  // Update captured flags count
  useEffect(() => {
    if (currentPlayer && Array.isArray(currentPlayer.capturedFlags)) {
      const capturedCount = currentPlayer.capturedFlags.length;
      console.log(`Syncing captured flags count: ${capturedCount}`);
      setCapturedFlagsCount(capturedCount);
    } else if (currentPlayer) {
      // Fallback to calculating captured flags from flags array if available
      if (Array.isArray(flags)) {
        const capturedFlags = flags.filter(f => f.status === 'captured' && f.capturedBy === currentPlayer.id);
        setCapturedFlagsCount(capturedFlags.length);
      } else {
        // Reset to 0 if no data is available
        setCapturedFlagsCount(0);
      }
    }
  }, [currentPlayer, flags]);

  // WebSocket connection
  useEffect(() => {
    if (!session || !currentPlayer) return;

    if (!webSocketService.isConnected()) {
      try {
        webSocketService.connect(session.id, currentPlayer.id);
        
        if (typeof webSocketService.onPlayerUpdate === 'function') {
          webSocketService.onPlayerUpdate((players) => {
            setOtherPlayers(players.filter(p => p.id !== currentPlayer.id));
          });
        } else {
          console.log("WebSocket service doesn't have onPlayerUpdate method");
        }
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setError('Failed to connect to game server');
      }
    }

    return () => webSocketService.disconnect();
  }, [session, currentPlayer, setError]);

  // Enhance game over handling
  useEffect(() => {
    if (isGameOver) {
      stopBackgroundMusic(); // Use the hook method instead of direct access
      
      // You might want to save the final score or game stats here
      const finalScore = capturedFlagsCount;
      
      // Notify the backend about game completion if needed
      if (session) {
        try {
          // This is a placeholder - implement your actual API call
          console.log('Sending game completion data to server');
          // await api.completeGame(session.id, { score: finalScore });
        } catch (error) {
          console.error('Failed to save game results:', error);
        }
      }
    }
  }, [isGameOver, capturedFlagsCount, session, stopBackgroundMusic]);

  // Event handlers
  const handleFlagCapture = useCallback((flagId: string) => {
    if (!currentPlayer || !session) return;
  
    console.log("Capturing flag:", flagId);
    
    // Force immediate UI update for better responsiveness
    setCapturedFlagsCount(prevCount => {
      const newCount = prevCount + 1;
      console.log(`Flags captured: ${newCount} of ${flags.length}`);
      
      // Check if all flags are captured
      if (newCount >= flags.length) {
        setIsGameOver(true);
      }
      
      return newCount;
    });
    
    // Update local state FIRST
    // This is critical - we must update our local flags array
    setFlags(prevFlags => {
      const updatedFlags = prevFlags.map(f => 
        f.id === flagId 
          ? { ...f, status: 'captured', capturedBy: currentPlayer.id } 
          : f
      );
      console.log("Updated flags array:", updatedFlags);
      return updatedFlags;
    });
    
    // Then update the store
    captureFlag(flagId);
    
    // Play capture sound
    const difficulty = session?.settings?.difficulty || 'medium';
    playFlagCaptureSound(difficulty as 'easy' | 'medium' | 'hard');
  }, [currentPlayer, session, flags.length, captureFlag, playFlagCaptureSound]);

  // Add a debug effect to log when flag count changes
  useEffect(() => {
    console.log(`Flag count updated to: ${capturedFlagsCount}`);
  }, [capturedFlagsCount]);

  // Monitor for captured flags changes explicitly
  useEffect(() => {
    const capturedFlags = flags.filter(f => f.status === 'captured');
    if (capturedFlags.length !== capturedFlagsCount) {
      console.log(`Updating flag count from ${capturedFlagsCount} to ${capturedFlags.length}`);
      setCapturedFlagsCount(capturedFlags.length);
    }
  }, [flags, capturedFlagsCount]);

  const handlePlayerMove = useCallback((position: Position) => {
    if (!currentPlayer || !session) return;
    updatePlayerPosition(position);
  }, [currentPlayer, session, updatePlayerPosition]);

  const handleLeaveGame = useCallback(() => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      leaveSession();
      navigate('/');
    }
  }, [leaveSession, navigate]);

  const handleCloseGameOver = useCallback(() => {
    // Navigate back to lobby or home
    navigate('/');
  }, [navigate]);

  // Conditional rendering
  if (isLoading || !session) {
    return <LoadingScreen error={loadError} />;
  }

  if (playerCreationError) {
    return <PlayerErrorScreen onReturn={() => navigate('/')} />;
  }

  if (session && !currentPlayer) {
    return <PlayerLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      <GameHeader
        timeLeft={timeLeft}
        flagsCaptured={capturedFlagsCount}
        totalFlags={flags.length}
        playerCount={session?.players?.length || 0}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        onLeaveGame={handleLeaveGame}
      />
      
      <GameContent
        session={session}
        currentPlayer={currentPlayer}
        flags={flags}
        onFlagCapture={handleFlagCapture}
        onMove={handlePlayerMove}
        onMazeRendered={() => setIsMazeRendered(true)}
        difficulty={session?.settings?.difficulty || 'medium'}
        soundEnabled={soundEnabled} // Pass soundEnabled down the component tree
        gameMode={session?.settings?.gameMode || 'normal'} // Add gameMode from session settings
      />
      
      <GameLeaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        players={session?.players || []}
      />
      
      <GameOverModal 
        isOpen={isGameOver}
        onClose={handleCloseGameOver}
        reason={timeLeft <= 0 ? "Time's up!" : "All flags captured!"}
        flagsCaptured={capturedFlagsCount}
        totalFlags={flags.length}
      />
    </div>
  );
};

export default Game;