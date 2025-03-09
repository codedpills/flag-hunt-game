import { useState, useEffect, useRef } from 'react';

interface UseGameSoundProps {
  initialEnabled?: boolean;
  backgroundMusicPath?: string;
}

export const useGameSound = ({ 
  initialEnabled = true,
  backgroundMusicPath = '/sounds/game-music.mp3'
}: UseGameSoundProps = {}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialEnabled);
  const [backgroundMusic, setBackgroundMusic] = useState<HTMLAudioElement | null>(null);
  const isMusicInitialized = useRef(false);

  // Initialize background music
  const initBackgroundMusic = () => {
    if (!isMusicInitialized.current && soundEnabled) {
      const music = new Audio(backgroundMusicPath);
      music.loop = true;
      music.volume = 0.5;
      music.play().catch(e => console.log('Audio playback prevented:', e));
      setBackgroundMusic(music);
      isMusicInitialized.current = true;
      
      return () => {
        music.pause();
        music.currentTime = 0;
        isMusicInitialized.current = false;
      };
    }
  };

  // Add a function to stop background music
  const stopBackgroundMusic = () => {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  };

  // Toggle sound on/off
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Play a sound effect
  const playSound = (soundPath: string, volume: number = 1.0) => {
    if (soundEnabled) {
      const sound = new Audio(soundPath);
      sound.volume = volume;
      sound.play().catch(e => console.log('Audio playback prevented:', e));
    }
  };

  // Enhanced play sound with multiple variations
  const playFlagCaptureSound = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!soundEnabled) return;
    
    let soundPath = '/sounds/flag-capture.mp3'; // Default sound
    let volume = 0.7;
    
    // Difficulty-specific sounds
    switch(difficulty) {
      case 'easy':
        soundPath = '/sounds/flag-capture-easy.mp3'; // Create these sound files
        volume = 0.8;
        break;
      case 'medium':
        soundPath = '/sounds/flag-capture-medium.mp3';
        volume = 0.7;
        break;
      case 'hard':
        soundPath = '/sounds/flag-capture-hard.mp3';
        volume = 0.6;
        break;
    }
    
    // Play the sound
    const sound = new Audio(soundPath);
    sound.volume = volume;
    sound.play().catch(e => console.log('Audio playback prevented:', e));
  };

  // Handle background music toggle
  useEffect(() => {
    if (backgroundMusic) {
      if (soundEnabled) {
        backgroundMusic.play().catch(e => console.log('Audio playback prevented:', e));
      } else {
        backgroundMusic.pause();
      }
    }
  }, [soundEnabled, backgroundMusic]);

  return {
    soundEnabled,
    toggleSound,
    playSound,
    playFlagCaptureSound, // Add the new function
    initBackgroundMusic,
    stopBackgroundMusic // Export the new function
  };
};
