import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Users, Clock, Target, Share2 } from 'lucide-react';
import Button from '../components/common/Button';
import { useGameStore } from '../store/gameStore';
import { GameMode, GameSettings } from '../types/game';
import { api } from '../services/api';

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { createSession, currentPlayer } = useGameStore();
  
  const [settings, setSettings] = useState<GameSettings>({
    gameMode: 'normal',
    playerCount: 10,
    duration: 300, // 5 minutes
    flagCount: 20,
    difficulty: 'medium',
  });
  
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Redirect to home if no player is set
  useEffect(() => {
    if (!currentPlayer) {
      console.log('No current player, redirecting to home');
      navigate('/');
    }
  }, [currentPlayer, navigate]);
  
  const handleGameModeChange = (mode: GameMode) => {
    setSettings({ ...settings, gameMode: mode });
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    soundEffect.volume = 0.3;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
  };
  
  const handlePlayerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSettings({ ...settings, playerCount: value });
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setSettings({ ...settings, duration: value });
  };
  
  const handleFlagCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSettings({ ...settings, flagCount: value });
  };
  
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, difficulty: e.target.value as 'easy' | 'medium' | 'hard' });
  };
  
  const generateInviteLink = () => {
    // In a real implementation, this would generate a unique link
    const link = `https://flag-hunt.example.com/join/${Date.now()}`;
    setInviteLink(link);
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    soundEffect.volume = 0.5;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
  };
  
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/2588/2588-preview.mp3');
    soundEffect.volume = 0.5;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
    
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };
  
  const startGame = async () => {
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    soundEffect.volume = 0.5;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
    
    setIsCreatingSession(true);
    
    try {
      // Create session via API
      const session = await api.createSession(settings);
      
      // Update local state
      createSession(settings);
      
      // Navigate to game
      navigate('/game');
    } catch (error) {
      console.error('Error creating session:', error);
      // Fallback to local session creation
      createSession(settings);
      navigate('/game');
    } finally {
      setIsCreatingSession(false);
    }
  };
  
  // Add a loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if player is loaded
  useEffect(() => {
    if (currentPlayer) {
      setIsLoading(false);
    }
  }, [currentPlayer]);
  
  // Show loading state or redirect if no player
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we set up your game session.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      <header className="bg-white bg-opacity-10 backdrop-blur-sm p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Flag className="text-white mr-2" size={24} />
            <h1 className="text-2xl font-bold text-white">Game Lobby</h1>
          </div>
          <div className="text-white">
            Playing as: <span className="font-bold">{currentPlayer?.nickname || 'Guest'}</span>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Game Setup</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Game Mode Selection */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Flag className="mr-2" size={20} />
                Game Mode
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div 
                  className={`
                    p-4 border rounded-lg cursor-pointer
                    ${settings.gameMode === 'normal' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'}
                  `}
                  onClick={() => handleGameModeChange('normal')}
                >
                  <h4 className="font-medium">Normal Game</h4>
                  <p className="text-sm text-gray-600">
                    Capture as many flags as possible within the time limit.
                  </p>
                </div>
                
                <div 
                  className={`
                    p-4 border rounded-lg cursor-pointer
                    ${settings.gameMode === 'red-flag' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'}
                  `}
                  onClick={() => handleGameModeChange('red-flag')}
                >
                  <h4 className="font-medium">Red Flag</h4>
                  <p className="text-sm text-gray-600">
                    Team-based mode. Capture the red flag to win instantly.
                  </p>
                </div>
                
                <div 
                  className={`
                    p-4 border rounded-lg cursor-pointer
                    ${settings.gameMode === 'last-ones-out' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'}
                  `}
                  onClick={() => handleGameModeChange('last-ones-out')}
                >
                  <h4 className="font-medium">Last Ones Out</h4>
                  <p className="text-sm text-gray-600">
                    Escape the maze by reaching the exit door. Last players lose.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Game Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Target className="mr-2" size={20} />
                Game Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Users className="mr-1" size={16} />
                    Player Count: {settings.playerCount}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={settings.playerCount}
                    onChange={handlePlayerCountChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>2</span>
                    <span>40</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Clock className="mr-1" size={16} />
                    Game Duration
                  </label>
                  <select
                    value={settings.duration}
                    onChange={handleDurationChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value={60}>1 minute</option>
                    <option value={180}>3 minutes</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={900}>15 minutes</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Flag className="mr-1" size={16} />
                    Flag Count: {settings.flagCount}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={settings.flagCount}
                    onChange={handleFlagCountChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={settings.difficulty}
                    onChange={handleDifficultyChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Invite Link */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Share2 className="mr-2" size={20} />
              Invite Friends
            </h3>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                placeholder="Generate an invite link to share with friends"
                className="flex-grow p-2 border border-gray-300 rounded-md bg-gray-50"
              />
              
              {inviteLink ? (
                <Button 
                  onClick={copyInviteLink}
                  variant={linkCopied ? 'secondary' : 'primary'}
                >
                  {linkCopied ? 'Copied!' : 'Copy'}
                </Button>
              ) : (
                <Button onClick={generateInviteLink}>
                  Generate Link
                </Button>
              )}
            </div>
          </div>
          
          {/* Start Game Button */}
          <div className="flex justify-center">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={startGame}
              disabled={isCreatingSession}
            >
              {isCreatingSession ? 'Creating Game...' : 'Start Game'}
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="bg-white bg-opacity-10 backdrop-blur-sm p-4 text-center text-white">
        <p>&copy; 2025 Flag Hunt Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Lobby;