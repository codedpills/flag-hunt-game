import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Clock, Trophy, Volume2, VolumeX, Users } from 'lucide-react';
import MapCanvas from '../components/game/MapCanvas';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { useGameStore } from '../store/gameStore';
import { Position, Flag as FlagType } from '../types/game';
import { webSocketService } from '../services/websocket';
import { api } from '../services/api';
import { useSessionManager } from '../hooks/useSessionManager';

// Component to show loading state
const LoadingScreen: React.FC<{ error?: string | null }> = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="bg-white p-8 rounded-xl shadow-xl text-center">
      {error ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Game</h2>
          <p className="mb-4">{error}</p>
          <p>Redirecting to home page...</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p>Please wait while we set up your game session.</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </>
      )}
    </div>
  </div>
);

// Component to show player error
const PlayerErrorScreen: React.FC<{ onReturn: () => void }> = ({ onReturn }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="bg-white p-8 rounded-xl shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Player Not Found</h2>
      <p className="mb-4">Unable to find or create player information.</p>
      <Button onClick={onReturn}>Return to Home</Button>
    </div>
  </div>
);

// Component to show player loading
const PlayerLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="bg-white p-8 rounded-xl shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-4">Setting Up Player...</h2>
      <p className="mb-4">Please wait while we set up your player.</p>
      <div className="mt-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </div>
  </div>
);

// Main Game component
const Game: React.FC = () => {
  const navigate = useNavigate();
  const { session, currentPlayer, updatePlayerPosition, captureFlag, leaveSession, setError } = useGameStore();
  const { session: sessionFromManager, startSessionTimer, getSession } = useSessionManager();

  // All useState hooks must be declared at the top level
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [isGameOver, setIsGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null);
  const [capturedFlagsCount, setCapturedFlagsCount] = useState(0);
  const [flags, setFlags] = useState<FlagType[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<{ id: string; nickname: string; score: number }[]>([]);
  const [isMazeRendered, setIsMazeRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playerCreationAttempted, setPlayerCreationAttempted] = useState(false);
  const [playerCreationError, setPlayerCreationError] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Refs to prevent stale closures in event handlers
  const sessionRef = useRef(session);
  const currentPlayerRef = useRef(currentPlayer);
  const timeLeftRef = useRef(timeLeft);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerInitializedRef = useRef<boolean>(false);

  // Update refs
  useEffect(() => {
    sessionRef.current = session;
    currentPlayerRef.current = currentPlayer;
    timeLeftRef.current = timeLeft;
  }, [session, currentPlayer, timeLeft]);

  // Load session data when component mounts
  useEffect(() => {
    const playerName = localStorage.getItem('player');
    const avatar = localStorage.getItem('avatar');
    const sessionId = localStorage.getItem('sessionId');

    // If we don't have player information or session ID, redirect to home
    if (!playerName || !avatar || !sessionId) {
      console.log('No player or session information found, redirecting to home');
      navigate('/');
      return;
    }

    // If we don't have a session in the store yet, but we have the info in localStorage,
    // try to load the session
    if (!session && sessionId) {
      console.log('Loading session data for ID:', sessionId);
      setIsLoading(true);
      setLoadError(null);

      // Try to load the session
      getSession(sessionId)
        .then(loadedSession => {
          console.log('Successfully loaded session:', loadedSession);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to load session:', error);
          setLoadError(error.message || 'Failed to load game session');
          setIsLoading(false);

          // After 3 seconds, redirect to home
          setTimeout(() => {
            navigate('/');
          }, 3000);
        });
    } else {
      setIsLoading(false);
    }
  }, [session, navigate, getSession]);

  // Handle player creation in a separate effect
  useEffect(() => {
    // Only run this if we have a session but no current player
    if (session && !currentPlayer && !playerCreationAttempted) {
      console.log('Session loaded but no current player found');
      setPlayerCreationAttempted(true);

      // Try to create a player from localStorage
      const playerName = localStorage.getItem('player');
      const avatar = localStorage.getItem('avatar');

      if (playerName && avatar) {
        console.log('Creating player from localStorage data');
        const tempPlayer = {
          id: `player-${Date.now()}`,
          nickname: playerName,
          avatar: avatar,
          position: { x: 0, y: 0 },
          score: 0,
          status: 'active' as const
        };

        // Use the imported hooks instead of direct store access
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

  // Session timer effect
  useEffect(() => {
    if (sessionFromManager) {
      const cleanup = startSessionTimer(sessionFromManager.id);
      return cleanup;
    }
  }, [sessionFromManager, startSessionTimer]);

  useEffect(() => {
    if (session && currentPlayer && currentPlayer.position) {
      setIsGameStarted(true);
    }
  }, [session, currentPlayer]);

  // Initialize flags when session is loaded
  useEffect(() => {
    if (session && session.flags) {
      setFlags(session.flags);
    }
  }, [session]);

  // Update captured flags count
  useEffect(() => {
    if (currentPlayer && session) {
      const capturedCount = currentPlayer.capturedFlags?.length || 0;
      setCapturedFlagsCount(capturedCount);
    }
  }, [currentPlayer, session]);

  // Memoize event handlers
  const handleFlagCapture = useCallback((flagId: string) => {
    if (!currentPlayer || !session) return;

    // Update player score
    captureFlag(flagId);

    // Play sound effect if enabled
    if (soundEnabled) {
      const captureSound = new Audio('/sounds/flag-capture.mp3');
      captureSound.play();
    }

    // Check if all flags are captured
    const newCapturedCount = capturedFlagsCount + 1;
    setCapturedFlagsCount(newCapturedCount);

    if (newCapturedCount >= flags.length) {
      console.log('All flags captured! Game over.');
      setIsGameOver(true);
    }
  }, [currentPlayer, session, flags.length, captureFlag, soundEnabled, capturedFlagsCount]);

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

  // Initialize background music
  useEffect(() => {
    if (isMazeRendered && soundEnabled && !backgroundMusic) {
      const music = new Audio('/sounds/game-music.mp3');
      music.loop = true;
      music.volume = 0.5;
      music.play().catch(e => console.log('Audio playback prevented:', e));
      setBackgroundMusic(music);

      return () => {
        music.pause();
        music.currentTime = 0;
      };
    }
  }, [isMazeRendered, soundEnabled, backgroundMusic]);

  // Toggle sound
  useEffect(() => {
    if (backgroundMusic) {
      if (soundEnabled) {
        backgroundMusic.play().catch(e => console.log('Audio playback prevented:', e));
      } else {
        backgroundMusic.pause();
      }
    }
  }, [soundEnabled, backgroundMusic]);

  // Add error boundary for WebSocket operations
  useEffect(() => {
    if (!session || !currentPlayer) return;

    // Only connect if not already connected
    if (!webSocketService.isConnected()) {
      try {
        // Connect to WebSocket
        webSocketService.connect(session.id, currentPlayer.id);

        // Use a safer approach to handle player updates
        // This avoids the error if onPlayerUpdate doesn't exist
        if (typeof webSocketService.onPlayerUpdate === 'function') {
          webSocketService.onPlayerUpdate((players: any[]) => {
            setOtherPlayers(players.filter(p => p.id !== currentPlayer.id));
          });
        } else {
          console.log("WebSocket service doesn't have onPlayerUpdate method");
          // Use a fallback approach or just display local players
        }

        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setError('Failed to connect to game server');
      }
    }

    // Clean up on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [session, currentPlayer, setError]);

  // DEBUG: Add these to confirm session settings
  useEffect(() => {
    if (session?.settings) {
      console.log('DEBUG Session settings:', {
        duration: session.settings.duration,
        gameMode: session.settings.gameMode,
      });
    }
  }, [session]);

  // ADD this single, reliable timer implementation
  useEffect(() => {
    console.log("⏰ Timer effect executing. Timer ref:", !!timerRef.current);
    
    // Clear any existing timer to avoid duplicates
    if (timerRef.current) {
      console.log("⏰ Clearing existing timer before setting up a new one");
      clearInterval(timerRef.current);
      timerRef.current = null;
      timerInitializedRef.current = false;
    }
    
    // Exit if no session
    if (!session) {
      console.log("⏰ No session available, waiting...");
      return;
    }

    // Get duration from settings or use default
    const minutes = session.settings?.duration || 5; // Default to 5 minutes
    const durationInSeconds = minutes * 60;
    
    console.log(`⏰ Starting timer for ${minutes} minutes (${durationInSeconds} seconds)`);
    
    // Set initial time
    setTimeLeft(durationInSeconds);
    
    // Start timer with a direct reference to the interval ID
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        // Less frequent logging
        if (newTime % 10 === 0 || newTime < 10) {
          console.log(`⏰ Timer: ${Math.floor(newTime / 60)}:${(newTime % 60).toString().padStart(2, '0')}`);
        }
        
        if (newTime <= 0) {
          console.log('⏰ Time up! Game over.');
          clearInterval(timerId);
          setIsGameOver(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    // Store the timer reference
    timerRef.current = timerId;
    console.log("⏰ Timer started with ID:", timerId);
    
    // Cleanup function
    return () => {
      console.log("⏰ Cleaning up timer with ID:", timerId);
      clearInterval(timerId);
      timerRef.current = null;
    };
  }, []); // Empty dependency array - only run ONCE when component mounts

  // Keep the game over effect for cleanup
  useEffect(() => {
    if (isGameOver) {
      console.log('Game over state detected');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Game over logic
    }
  }, [isGameOver]);

  // Conditional rendering based on the current state
  if (isLoading || !session) {
    return <LoadingScreen error={loadError} />;
  }

  if (playerCreationError) {
    return <PlayerErrorScreen onReturn={() => navigate('/')} />;
  }

  if (session && !currentPlayer) {
    return <PlayerLoadingScreen />;
  }

  // Main game content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      {/* Game header with stats - Add sticky positioning */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="flex items-center">
            <Flag className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-bold">{capturedFlagsCount}/{flags.length}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-bold">{session?.players?.length || 0} Players</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button 
            onClick={() => setShowLeaderboard(true)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Show leaderboard"
          >
            <Trophy className="h-5 w-5 text-yellow-500" />
          </button>
          <Button 
            onClick={handleLeaveGame}
            variant="danger"
            size="sm"
            aria-label="Leave game"
          >
            Leave Game
          </Button>
        </div>
      </div>
      {/* Game canvas - Ensure proper scrolling behavior */}
      <div className="flex-1 relative overflow-auto">
        {session && currentPlayer && currentPlayer.position && (
          <div>
            {console.log('Current player position before rendering MapCanvas:', currentPlayer?.position)}
            <MapCanvas
              session={session}
              currentPlayer={currentPlayer}
              playerPosition={currentPlayer.position}
              flags={flags}
              onFlagCapture={handleFlagCapture}
              onMove={handlePlayerMove}
              onMazeRendered={() => setIsMazeRendered(true)}
            />
          </div>
        )}
      </div>
      {/* Leaderboard modal */}
      <Modal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title="Leaderboard"
      >
        <div className="space-y-4">
          {session?.players
            ?.slice()
            .sort((a, b) => b.score - a.score)
            .map(player => (
              <div key={player.id} className="flex justify-between">
                <span>{player.nickname}</span>
                <span>{player.score}</span>
              </div>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default Game;