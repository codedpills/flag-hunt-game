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

        // Set the current player directly
        const gameStore = useGameStore.getState();
        gameStore.setCurrentPlayer(tempPlayer);

        // Update the session with the player
        gameStore.updateSession({
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
    console.log('Session:', JSON.stringify(session, null, 2)); // Log session details
    console.log('Current Player:', JSON.stringify(currentPlayer, null, 2)); // Log player details

    // Validate session and current player
    if (!session || !session.settings || !currentPlayer || !currentPlayer.id || !currentPlayer.position) {
      console.log('Invalid session or player data, cannot start timer.');
      return;
    }

    if (session.settings.duration && !isGameStarted) {
      // Set initial time from session settings
      const initialTime = session.settings.duration * 60; // Convert minutes to seconds
      setTimeLeft(initialTime);
      console.log('Initial Time Left:', initialTime); // Log initial time left

      // Start timer only if it's not already running
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            console.log('Time Left Before Update:', prevTime);
            const newTime = prevTime - 1;
            console.log('Timer tick:', newTime); // Log the current time
            if (newTime <= 0) {
              // Game over when time runs out
              clearInterval(timerRef.current);
              timerRef.current = null; // Reset timer reference
              setIsGameOver(true);
              return 0;
            }
            console.log('Time Left After Update:', newTime);
            return newTime;
          });
        }, 1000);

        console.log('Timer started'); // Log when timer starts
      }

      // Clean up timer on unmount
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null; // Reset timer reference on cleanup
      };
    }
  }, [session, currentPlayer, isGameStarted]);

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

  // Define Position type
  type Position = {
    x: number;
    y: number;
  };

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
    const newCapturedCount = (currentPlayer.capturedFlags?.length || 0) + 1;
    setCapturedFlagsCount(newCapturedCount);

    if (newCapturedCount >= flags.length) {
      // All flags captured, end game
      setIsGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [currentPlayer, session, flags.length, captureFlag, soundEnabled]);

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

        // Listen for player updates
        const handlePlayerUpdate = (players: any[]) => {
          setOtherPlayers(players.filter(p => p.id !== currentPlayer.id));
        };

        webSocketService.onPlayerUpdate(handlePlayerUpdate);

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
      {/* Game header with stats */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
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
      {/* Game canvas */}
      <div className="flex-1 relative overflow-hidden">
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