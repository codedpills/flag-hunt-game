import React from 'react';
import Button from '../common/Button';

export const LoadingScreen: React.FC<{ error?: string | null }> = ({ error }) => (
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

export const PlayerErrorScreen: React.FC<{ onReturn: () => void }> = ({ onReturn }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
    <div className="bg-white p-8 rounded-xl shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Player Not Found</h2>
      <p className="mb-4">Unable to find or create player information.</p>
      <Button onClick={onReturn}>Return to Home</Button>
    </div>
  </div>
);

export const PlayerLoadingScreen: React.FC = () => (
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
