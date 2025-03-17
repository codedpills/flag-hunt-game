import React, { useEffect } from 'react';
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
  // Simplify the debug logging to not run on every render
  useEffect(() => {
    console.log("GameContent initial render with difficulty:", difficulty);
    console.log("Initial flags count:", flags.length);
  }, []); // Empty dependency for initial render only

  // Add this debug effect to show the flag status more clearly during component rendering
  useEffect(() => {
    if (flags?.length > 0) {
      const availableFlags = flags.filter(f => f.status === 'available');
      const capturedFlags = flags.filter(f => f.status === 'captured');
      
      console.log(`🚩 FLAG STATUS: ${flags.length} total, ${availableFlags.length} available, ${capturedFlags.length} captured`);
      
      // Display the first few flags for inspection
      if (availableFlags.length > 0) {
        console.log("Sample available flag:", availableFlags[0]);
      }
    }
  }, [flags]);

  return (
    <div className="flex-1 relative overflow-auto">
      {/* Debug display for flags */}
      <div className="absolute top-0 left-0 bg-black bg-opacity-50 p-2 text-white text-xs z-50">
        <p>Flags: {flags?.length || 0} total, {flags?.filter(f => f.status === 'available').length || 0} available</p>
      </div>
      
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
