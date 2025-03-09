import React from 'react';
import Modal from '../common/Modal';

interface Player {
  id: string;
  nickname: string;
  score: number;
}

interface GameLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

const GameLeaderboard: React.FC<GameLeaderboardProps> = ({
  isOpen,
  onClose,
  players
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leaderboard"
    >
      <div className="space-y-4">
        {sortedPlayers.map(player => (
          <div key={player.id} className="flex justify-between">
            <span>{player.nickname}</span>
            <span>{player.score}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default GameLeaderboard;
