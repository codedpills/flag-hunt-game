import React from 'react';
import { Clock, Flag, Trophy, Volume2, VolumeX, Users } from 'lucide-react';
import Button from '../common/Button';

interface GameHeaderProps {
  timeLeft: number;
  flagsCaptured: number;
  totalFlags: number;
  playerCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowLeaderboard: () => void;
  onLeaveGame: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  timeLeft,
  flagsCaptured,
  totalFlags,
  playerCount,
  soundEnabled,
  onToggleSound,
  onShowLeaderboard,
  onLeaveGame
}) => {
  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-center">
          <Flag className="h-5 w-5 text-red-600 mr-2" />
          <span className="font-bold">{flagsCaptured}/{totalFlags}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-5 w-5 text-purple-600 mr-2" />
          <span className="font-bold">{playerCount} Players</span>
        </div>
      </div>
      <div className="flex space-x-3">
        <button 
          onClick={onToggleSound}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
        <button 
          onClick={onShowLeaderboard}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Show leaderboard"
        >
          <Trophy className="h-5 w-5 text-yellow-500" />
        </button>
        <Button 
          onClick={onLeaveGame}
          size="sm"
          aria-label="Leave game"
        >
          Leave Game
        </Button>
      </div>
    </div>
  );
};

export default GameHeader;
