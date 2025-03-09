import React, { useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Flag, Clock } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  flagsCaptured: number;
  totalFlags: number;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  reason,
  flagsCaptured,
  totalFlags
}) => {
  // Play sound effect when game ends
  useEffect(() => {
    if (isOpen) {
      const gameOverSound = new Audio('/sounds/game-over.mp3');
      gameOverSound.volume = 0.7;
      gameOverSound.play().catch(e => console.log('Audio playback prevented:', e));
    }
  }, [isOpen]);

  // Calculate score or performance
  const calculatePerformance = () => {
    const percentage = Math.round((flagsCaptured / totalFlags) * 100);
    
    if (percentage === 100) return { message: "Perfect score!", className: "text-yellow-500" };
    if (percentage >= 75) return { message: "Great job!", className: "text-green-500" };
    if (percentage >= 50) return { message: "Good effort!", className: "text-blue-500" };
    if (percentage >= 25) return { message: "Nice try!", className: "text-purple-500" };
    return { message: "Better luck next time!", className: "text-gray-500" };
  };

  const performance = calculatePerformance();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Game Over">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{reason}</h2>
        <p className={`text-xl font-bold ${performance.className}`}>{performance.message}</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Flag className="h-5 w-5 text-red-600 mr-2" />
            <span>Flags Captured</span>
          </div>
          <span className="font-bold">{flagsCaptured} / {totalFlags}</span>
        </div>
        
        <div className="w-full bg-gray-300 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${(flagsCaptured / totalFlags) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Button onClick={onClose} variant="primary" fullWidth>
          Return to Home
        </Button>
      </div>
    </Modal>
  );
};

export default GameOverModal;
