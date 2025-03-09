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
}

const GameContent: React.FC<GameContentProps> = ({
  session,
  currentPlayer,
  flags,
  onFlagCapture,
  onMove,
  onMazeRendered
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
          />
        </div>
      )}
    </div>
  );
};

export default GameContent;
