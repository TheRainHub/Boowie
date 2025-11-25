import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { BookStorage } from '../services/BookStorage';

export const useAudioPlayerHook = (audioUrl: string, bookId: string) => {
  const player = useAudioPlayer(audioUrl as AudioSource);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const saveProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, []);

  // Monitor player status changes
  useEffect(() => {
    setIsPlaying(player.playing);
  }, [player.playing]);

  // Update position and duration continuously
  useEffect(() => {
    const updateStatus = () => {
      try {
        if (player.duration > 0) {
          setDuration(player.duration * 1000); // Convert to ms
        }
        if (player.currentTime >= 0) {
          setPosition(player.currentTime * 1000); // Convert to ms
        }
      } catch (error) {
        // Ignore errors during status updates
      }
    };

    // Update every 100ms for smooth UI
    positionUpdateInterval.current = setInterval(updateStatus, 100);

    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [player]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      // Wait a bit for player to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check for saved progress
      const savedProgress = await BookStorage.getProgress(bookId);
      
      if (savedProgress?.position && savedProgress.position > 0) {
        // Seek to saved position (convert ms to seconds)
        player.seekTo(savedProgress.position / 1000);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio', error);
      setIsLoading(false);
    }
  };

  const saveProgress = async (pos: number, dur: number) => {
    try {
      if (pos > 0 && dur > 0) {
        await BookStorage.saveProgress({
          bookId,
          position: pos,
          duration: dur,
          lastPlayed: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const togglePlayPause = () => {
    try {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
        saveProgress(position, duration);
        
        if (saveProgressInterval.current) {
          clearInterval(saveProgressInterval.current);
        }
      } else {
        player.play();
        setIsPlaying(true);
        
        // Start auto-save interval (every 10 seconds)
        if (saveProgressInterval.current) {
          clearInterval(saveProgressInterval.current);
        }
        
        saveProgressInterval.current = setInterval(() => {
          const currentPosition = player.currentTime * 1000;
          const currentDuration = player.duration * 1000;
          
          if (currentPosition > 0 && currentDuration > 0) {
            saveProgress(currentPosition, currentDuration);
          }
        }, 10000);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const seekTo = (millis: number) => {
    try {
      const seconds = millis / 1000;
      player.seekTo(seconds);
      setPosition(millis);
      saveProgress(millis, duration);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const skipForward = (millis: number = 15000) => {
    try {
      const newPos = Math.min(position + millis, duration);
      const seconds = newPos / 1000;
      player.seekTo(seconds);
      setPosition(newPos);
      saveProgress(newPos, duration);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const skipBackward = (millis: number = 15000) => {
    try {
      const newPos = Math.max(position - millis, 0);
      const seconds = newPos / 1000;
      player.seekTo(seconds);
      setPosition(newPos);
      saveProgress(newPos, duration);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    try {
      player.setPlaybackRate(speed);
      setPlaybackSpeed(speed);
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  };

  return {
    sound: player,
    isPlaying,
    position,
    duration,
    isLoading,
    playbackSpeed,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    changePlaybackSpeed,
    loadAudio
  };
};

