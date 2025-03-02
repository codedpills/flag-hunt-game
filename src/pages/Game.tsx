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

const Game: React.FC = () => {
  const navigate = useNavigate();
  const { session, currentPlayer, updatePlayerPosition, captureFlag, leaveSession, setError } = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [isGameOver, setIsGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null);
  const [capturedFlagsCount, setCapturedFlagsCount] = useState(0);
  const [flags, setFlags] = useState<FlagType[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<{ id: string; nickname: string; score: number }[]>([]);
  const [isMazeRendered, setIsMazeRendered] = useState(false);
  
  // Refs to prevent stale closures in event handlers
  const sessionRef = useRef(session);
  const currentPlayerRef = useRef(currentPlayer);
  const timeLeftRef = useRef(timeLeft);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    sessionRef.current = session;
    currentPlayerRef.current = currentPlayer;
    timeLeftRef.current = timeLeft;
  }, [session, currentPlayer, timeLeft]);
  
  // Redirect to home if no session or player is set
  useEffect(() => {
    if (!session || !currentPlayer) {
      navigate('/');
    }
  }, [session, currentPlayer, navigate]);
  
  if (!session || !currentPlayer) {
    return null;
  }
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!session || !currentPlayer) return;
    
    // Only connect if not already connected
    if (!webSocketService.isConnected()) {
      try {
        webSocketService.connect(session.id, currentPlayer.id);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
    };
  }, [session?.id, currentPlayer?.id]);

  useEffect(() => {
    if (!currentPlayer.position && session?.mazeLayout && isMazeRendered) {
      const maze = session.mazeLayout;
      const cellSize = 50;
      
      // Calculate initial position
      const centerX = Math.floor(maze[0].length / 2);
      const centerY = Math.floor(maze.length / 2);
      const initialPosition = { 
        x: centerX * cellSize + cellSize/2,
        y: centerY * cellSize + cellSize/2
      };
      
      // Set initial position
      updatePlayerPosition(initialPosition);
      webSocketService.updatePosition(initialPosition);
      
      // Trigger test move after short delay
      setTimeout(() => {
        const testPosition = {
          x: initialPosition.x + 10,
          y: initialPosition.y + 10
        };
        updatePlayerPosition(testPosition);
        webSocketService.updatePosition(testPosition);
      }, 100);
    }
  }, [currentPlayer.position, session?.mazeLayout, isMazeRendered, updatePlayerPosition]);

  // Initialize flags
  useEffect(() => {
    if (!session) return;
    
    // Use flags from session if available
    if (session.flags && session.flags.length > 0) {
      setFlags(session.flags);
      
      // Count already captured flags
      const capturedCount = session.flags.filter(
        flag => flag.status === 'captured' && flag.capturedBy === currentPlayer.id
      ).length;
      
      setCapturedFlagsCount(capturedCount);
    } else {
      // Otherwise create new flags
      const newFlags: FlagType[] = [];
      const flagCount = session.settings.flagCount || 20;
      
      for (let i = 0; i < flagCount; i++) {
        // Generate random positions for flags
        const x = Math.floor(Math.random() * 2000) - 1000;
        const y = Math.floor(Math.random() * 2000) - 1000;
        
        newFlags.push({
          id: `flag-${i}`,
          position: { x, y },
          status: 'available',
        });
      }
      
      setFlags(newFlags);
      setCapturedFlagsCount(0);
    }
    
    // Initialize game timer
    setTimeLeft(session.settings.duration || 300);
    
    // Initialize background music
    const bgMusic = new Audio('https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    if (soundEnabled) {
      bgMusic.play().catch(e => console.log("Audio play error:", e));
    }
    
    setBackgroundMusic(bgMusic);
    
    // Set up other players
    if (session.players && session.players.length > 0) {
      const others = session.players.filter(p => p.id !== currentPlayer.id)
        .map(p => ({ id: p.id, nickname: p.nickname, score: p.score }));
      setOtherPlayers(others);
    }
    
    return () => {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
      }
    };
  }, [session, soundEnabled, currentPlayer?.id]);
  
  // Handle flag capture
  const handleFlagCapture = useCallback((flagId: string) => {
    // Update local state
    setFlags(prevFlags => 
      prevFlags.map(flag => 
        flag.id === flagId ? { ...flag, status: 'captured' } : flag
      )
    );
    setCapturedFlagsCount(prev => prev + 1);

    // Update game store
    captureFlag(flagId);

    // Update WebSocket
    webSocketService.captureFlag(flagId);
  }, [captureFlag]);

  // Game over handler
  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    setShowLeaderboard(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (backgroundMusic) {
      backgroundMusic.pause();
    }
  }, [backgroundMusic]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set up new timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleGameOver();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Clean up on unmount or when game over
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isGameOver, handleGameOver]);
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleMove = useCallback((position: Position) => {
    if (!position || (position.x === 0 && position.y === 0)) return;

    // Update local state only if position has changed
    if (
      !currentPlayer.position ||
      currentPlayer.position.x !== position.x ||
      currentPlayer.position.y !== position.y
    ) {
      updatePlayerPosition(position);
      webSocketService.updatePosition(position);
    }
  }, [currentPlayer.position, updatePlayerPosition]);

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentPlayer.position) return;

    const moveDistance = 50; // Pixels to move per key press
    const mapBoundary = 1000; // Maximum distance from center

    const { x, y } = currentPlayer.position;
    let newX = x;
    let newY = y;

    switch (direction) {
      case 'up':
        newY = Math.max(y - moveDistance, -mapBoundary);
        break;
      case 'down':
        newY = Math.min(y + moveDistance, mapBoundary);
        break;
      case 'left':
        newX = Math.max(x - moveDistance, -mapBoundary);
        break;
      case 'right':
        newX = Math.min(x + moveDistance, mapBoundary);
        break;
    }

    handleMove({ x: newX, y: newY });
  }, [currentPlayer.position, handleMove]);

  const handleExitGame = () => {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
    
    // Notify server that player is leaving
    try {
      webSocketService.leaveGame();
      
      // Also update via REST API
      if (session && currentPlayer) {
        api.leaveSession(session.id, currentPlayer.id)
          .catch(error => {
            console.error('Error leaving session via API:', error);
          });
      }
    } catch (error) {
      console.error('Error leaving game:', error);
    }
    
    leaveSession();
    navigate('/');
  };
  
  const handleRestartGame = () => {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
    navigate('/lobby');
  };
  
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    
    if (backgroundMusic) {
      if (soundEnabled) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play().catch(e => console.log("Audio play error:", e));
      }
    }
  };
  
  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
  };
  
  const handleMazeRendered = useCallback(() => {
    setIsMazeRendered(true);
  }, []);

  // Debug render
  console.log('Game component rendering with:', {
    currentPlayer: currentPlayer ? { 
      id: currentPlayer.id,
      position: currentPlayer.position,
      avatar: currentPlayer.avatar
    } : null,
    sessionId: session?.id,
    playerCount: session?.players?.length,
  });
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800">
      {/* Game Header */}
      <header className="bg-gray-800 bg-opacity-80 backdrop-blur-sm p-4 text-white">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Flag className="mr-2 text-yellow-400" size={24} />
            <h1 className="text-xl font-bold">Flag Hunt</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <Clock className="mr-1 text-blue-300" size={18} />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            
            <div className="flex items-center">
              <Flag className="mr-1 text-yellow-400" size={18} />
              <span>{capturedFlagsCount} / {flags.length}</span>
            </div>
            
            <div>
              <span className="font-medium">{currentPlayer?.nickname}</span>
            </div>
            
            <button 
              onClick={handleShowLeaderboard}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              title="Show Leaderboard"
            >
              <Users size={20} className="text-blue-300" />
            </button>
            
            <button 
              onClick={toggleSound}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            >
              {soundEnabled ? (
                <Volume2 size={20} className="text-green-400" />
              ) : (
                <VolumeX size={20} className="text-red-400" />
              )}
            </button>
          </div>
        </div>
      </header>
      
      {/* Debug Panel */}
      <div className="absolute top-20 right-4 bg-black bg-opacity-75 p-2 z-50 text-xs text-white">
        <div>Player Pos: {JSON.stringify(currentPlayer?.position)}</div>
        <button 
          onClick={() => {
            const newPos = { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 };
            console.log('Manual position update:', newPos);
            handleMove(newPos);
          }}
          className="mt-2 px-2 py-1 bg-blue-600 rounded text-white"
        >
          Test Move
        </button>
      </div>
      
      {/* Game Canvas */}
      <div className="flex-grow relative flex justify-center items-center p-4">
        <div className="w-full h-full max-w-6xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800">
          <MapCanvas
            onRendered={handleMazeRendered}
            playerPosition={currentPlayer?.position || { x: 100, y: 100 }}
            flags={flags}
            onMove={handleMove}
            onFlagCapture={handleFlagCapture}
            gameMode={session?.settings?.gameMode}
            soundEnabled={soundEnabled}
            playerAvatar={currentPlayer?.avatar || 'apple'}
          />
        </div>
        
        {/* Game controls help */}
        <div className="absolute bottom-8 left-8 bg-black bg-opacity-70 text-white p-4 rounded-lg text-sm shadow-lg border border-gray-700">
          <h3 className="font-bold mb-2 text-yellow-400">Game Controls</h3>
          <p>• Use arrow keys or WASD to move</p>
          <p>• Click anywhere to move to that location</p>
          <p>• Find and click on objects with glowing indicators to capture flags</p>
          <p>• Capture all flags before time runs out!</p>
        </div>
      </div>
      
      {/* Game Over Modal */}
      <Modal
        isOpen={isGameOver}
        onClose={() => { }}
        title="Game Over"
        size="md"
      >
        <div className="text-center">
          <Trophy className="mx-auto text-yellow-500 mb-4" size={64} />
          <h3 className="text-xl font-bold mb-2">Game Completed!</h3>
          <p className="mb-4">You captured {capturedFlagsCount} flags.</p>
          
          {/* Show leaderboard in game over modal */}
          <div className="mb-6">
            <h4 className="font-bold mb-2">Final Scores</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Rank </th>
                  <th className="py-2 text-left">Player</th>
                  <th className="py-2 text-right">Flags</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-blue-50">
                  <td className="py-2">1</td>
                  <td className="py-2 font-bold">{currentPlayer.nickname}</td>
                  <td className="py-2 text-right">{capturedFlagsCount}</td>
                </tr>
                {otherPlayers.map((player, index) => (
                  <tr key={player.id} className="border-b">
                    <td className="py-2">{index + 2}</td>
                    <td className="py-2">{player.nickname}</td>
                    <td className="py-2 text-right">{player.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-center gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={handleExitGame}
            >
              Exit to Home
            </Button>
            <Button 
              variant="primary" 
              onClick={handleRestartGame}
            >
              Play Again
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Leaderboard Modal */}
      <Modal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        title="Leaderboard"
        size="md"
      >
        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Rank</th>
                <th className="py-2 text-left">Player</th>
                <th className="py-2 text-right">Flags</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-blue-50">
                <td className="py-2">1</td>
                <td className="py-2 font-bold">{currentPlayer.nickname}</td>
                <td className="py-2 text-right">{capturedFlagsCount}</td>
              </tr>
              {otherPlayers.map((player, index) => (
                <tr key={player.id} className="border-b">
                  <td className="py-2">{index + 2}</td>
                  <td className="py-2">{player.nickname}</td>
                  <td className="py-2 text-right">{player.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => setShowLeaderboard(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Game;