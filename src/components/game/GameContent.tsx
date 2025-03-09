import React from 'react';
import MapCanvas from './MapCanvas';
import { Position, Flag as FlagType } from '../../types/game';

interface GameContentProps {
  session: any;
  currentPlayer: any;
  flags: FlagType[];
  onFlagCapture: (flagId: string) => void;
  onMove: (position: Position) => void;
  onMazeRendered: () => void;
  difficulty?: 'easy' | 'medium' | 'hard'; // Add difficulty prop
  soundEnabled: boolean; // Add this prop
  gameMode?: 'normal' | 'red-flag' | 'last-ones-out'; // Add this prop
}

const GameContent: React.FC<GameContentProps> = ({
  session,
  currentPlayer,
  flags,
  onFlagCapture,
  onMove,
  onMazeRendered,
  difficulty = 'medium', // Default to medium
  soundEnabled, // Destructure it
  gameMode = 'normal' // Default to normal
}) => {
  return (
    <div className="flex-1 relative overflow-auto">
      {session && currentPlayer && currentPlayer.position && (
        <div>
          <MapCanvas
            session={session}
            currentPlayer={currentPlayer}
            playerPosition={currentPlayer.position}
            flags={flags}
            onFlagCapture={onFlagCapture}
            onMove={onMove}
            onMazeRendered={onMazeRendered}
            difficulty={difficulty}
            soundEnabled={soundEnabled} // Pass it to MapCanvas
            gameMode={gameMode} // Pass gameMode to MapCanvas
          />
        </div>
      )}
    </div>
  );
};

export default GameContent;
