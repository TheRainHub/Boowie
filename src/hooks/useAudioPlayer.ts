

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { BookStorage } from '../services/BookStorage';
import { AppState } from 'react-native';
import { Chapter } from '../types';

export const useAudioPlayerHook = (chapters: Chapter[], bookId: string) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const currentChapter = chapters[currentChapterIndex];
  
  // Initialize player with current chapter
  const player = useAudioPlayer(currentChapter?.uri as AudioSource);
  
  // Keep a ref to the current player so we always use the latest one
  const playerRef = useRef(player);
  
  // Update ref when player changes
  useEffect(() => {
    playerRef.current = player;
    console.log(`Player ref updated for chapter ${currentChapterIndex}: ${currentChapter?.filename}`);
    console.log(`Player state - duration: ${player.duration}, currentTime: ${player.currentTime}, playing: ${player.playing}`);
    
    // Warn about AWB format limitations
    if (currentChapter?.filename?.toLowerCase().endsWith('.awb')) {
      console.warn(`⚠️ AWB format detected: ${currentChapter.filename}. This format may not support seek operations. Consider converting to MP3 for full functionality.`);
    }
  }, [player, currentChapter]);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  
  const saveProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const sleepTimerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveProgressInterval.current) clearInterval(saveProgressInterval.current);
      if (positionUpdateInterval.current) clearInterval(positionUpdateInterval.current);
      if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
    };
  }, []);

  // Monitor player status changes
  useEffect(() => {
    setIsPlaying(player.playing);
  }, [player.playing]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // expo-audio handles background playback automatically
    });
    return () => subscription.remove();
  }, []);

  // Update position and duration continuously
  useEffect(() => {
    let lastLoggedDuration = 0;
    
    const updateStatus = () => {
      try {
        const currentPlayer = playerRef.current;
        if (!currentPlayer) return;
        
        if (currentPlayer.duration > 0) {
          const newDuration = currentPlayer.duration * 1000;
          // Only log when duration actually changes significantly
          if (Math.abs(newDuration - lastLoggedDuration) > 100) {
            console.log(`Duration loaded for chapter ${currentChapterIndex}: ${currentPlayer.duration}s`);
            lastLoggedDuration = newDuration;
          }
          setDuration(newDuration);
        }
        
        if (currentPlayer.currentTime >= 0) {
          setPosition(currentPlayer.currentTime * 1000);
        }
        
        // Auto-advance logic
        if (currentPlayer.duration > 0 && currentPlayer.currentTime >= currentPlayer.duration - 0.5) {
             if (currentChapterIndex < chapters.length - 1) {
                 nextChapter();
             } else {
                 currentPlayer.pause();
                 setIsPlaying(false);
             }
        }
      } catch (error) {
        console.error('Error in updateStatus:', error);
      }
    };

    positionUpdateInterval.current = setInterval(updateStatus, 100);
    return () => {
      if (positionUpdateInterval.current) clearInterval(positionUpdateInterval.current);
    };
  }, [currentChapterIndex, chapters.length]);

  // Sleep Timer Logic
  useEffect(() => {
    if (sleepTimerMinutes !== null && sleepTimerRemaining === null) {
      const endTime = Date.now() + sleepTimerMinutes * 60 * 1000;
      setSleepTimerRemaining(sleepTimerMinutes * 60);

      sleepTimerInterval.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setSleepTimerRemaining(remaining);

        if (remaining <= 0) {
          if (player.playing) {
            player.pause();
            setIsPlaying(false);
            saveProgress(position, duration);
          }
          if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
          setSleepTimerMinutes(null);
          setSleepTimerRemaining(null);
        }
      }, 1000);
    }
    return () => {
      if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
    };
  }, [sleepTimerMinutes]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const savedProgress = await BookStorage.getProgress(bookId);
      
      if (savedProgress) {
        // Restore chapter if saved
        if (savedProgress.currentChapter !== undefined && savedProgress.currentChapter !== currentChapterIndex) {
            if (savedProgress.currentChapter < chapters.length) {
                setCurrentChapterIndex(savedProgress.currentChapter);
                // Note: Changing state will trigger re-render and new player instance
                // We might need to seek after that re-render. 
                // For simplicity, we'll let the next effect handle seeking if needed or just start from 0 of that chapter
            }
        }
        
        if (savedProgress.position > 0) {
          player.seekTo(savedProgress.position / 1000);
        }
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
          currentChapter: currentChapterIndex
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const togglePlayPause = () => {
    try {
      const currentPlayer = playerRef.current;
      if (currentPlayer.playing) {
        currentPlayer.pause();
        setIsPlaying(false);
        saveProgress(position, duration);
        if (saveProgressInterval.current) clearInterval(saveProgressInterval.current);
      } else {
        currentPlayer.play();
        setIsPlaying(true);
        if (saveProgressInterval.current) clearInterval(saveProgressInterval.current);
        saveProgressInterval.current = setInterval(() => {
          const currentPosition = currentPlayer.currentTime * 1000;
          const currentDuration = currentPlayer.duration * 1000;
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
      const currentPlayer = playerRef.current;
      console.log(`seekTo called: ${millis}ms, chapter: ${currentChapterIndex}, filename: ${currentChapter?.filename}`);
      console.log(`Player available: ${!!currentPlayer}, seekTo method: ${!!currentPlayer?.seekTo}, duration: ${duration}ms`);
      console.log(`Current position BEFORE seek: ${position}ms (${(position / 1000).toFixed(2)}s)`);
      
      if (!currentPlayer || !currentPlayer.seekTo) {
        console.warn('Player or seekTo not available');
        return;
      }
      
      if (duration <= 0) {
        console.warn('Cannot seek - duration not loaded yet');
        return;
      }
      
      const seconds = Math.max(0, Math.min(millis / 1000, duration / 1000));
      console.log(`Attempting seek to ${seconds}s (${millis}ms) in chapter ${currentChapterIndex}`);
      
      try {
        currentPlayer.seekTo(seconds);
        console.log(`✅ Seek successful to ${seconds}s`);
        
        // Check actual position after a short delay
        setTimeout(() => {
          const actualPosition = currentPlayer.currentTime * 1000;
          console.log(`📍 Position AFTER seek: ${actualPosition}ms (${(actualPosition / 1000).toFixed(2)}s)`);
          console.log(`📊 Seek delta: expected ${millis}ms, got ${actualPosition}ms, diff: ${Math.abs(millis - actualPosition)}ms`);
        }, 200);
      } catch (seekError) {
        console.error(`❌ Seek failed:`, seekError);
        throw seekError;
      }
      
      setPosition(millis);
      saveProgress(millis, duration);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const skipForward = (millis: number = 15000) => {
    try {
      const currentPlayer = playerRef.current;
      if (!currentPlayer || !currentPlayer.seekTo) {
        console.warn('Player or seekTo not available');
        return;
      }
      
      const newPos = Math.min(position + millis, duration);
      const seconds = newPos / 1000;
      console.log(`Skip forward to ${seconds}s`);
      currentPlayer.seekTo(seconds);
      setPosition(newPos);
      saveProgress(newPos, duration);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const skipBackward = (millis: number = 15000) => {
    try {
      const currentPlayer = playerRef.current;
      if (!currentPlayer || !currentPlayer.seekTo) {
        console.warn('Player or seekTo not available');
        return;
      }
      
      const newPos = Math.max(position - millis, 0);
      const seconds = newPos / 1000;
      console.log(`Skip backward to ${seconds}s`);
      currentPlayer.seekTo(seconds);
      setPosition(newPos);
      saveProgress(newPos, duration);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    try {
      const currentPlayer = playerRef.current;
      currentPlayer.setPlaybackRate(speed);
      setPlaybackSpeed(speed);
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  };

  const setSleepTimer = (minutes: number | null) => {
    if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
    setSleepTimerMinutes(minutes);
    setSleepTimerRemaining(null);
  };

  const cancelSleepTimer = () => {
    if (sleepTimerInterval.current) clearInterval(sleepTimerInterval.current);
    setSleepTimerMinutes(null);
    setSleepTimerRemaining(null);
  };
  
  const nextChapter = () => {
      if (currentChapterIndex < chapters.length - 1) {
          setCurrentChapterIndex(prev => prev + 1);
          // Reset position for new chapter
          setPosition(0);
          // Player will update automatically due to key change or hook re-run
      }
  };
  
  const previousChapter = () => {
      if (currentChapterIndex > 0) {
          setCurrentChapterIndex(prev => prev - 1);
          setPosition(0);
      }
  };

  return {
    sound: player,
    isPlaying,
    position,
    duration,
    isLoading,
    playbackSpeed,
    sleepTimerMinutes,
    sleepTimerRemaining,
    currentChapterIndex,
    currentChapter,
    togglePlayPause,
    seekTo,
    skipForward,
    skipBackward,
    changePlaybackSpeed,
    setSleepTimer,
    cancelSleepTimer,
    loadAudio,
    nextChapter,
    previousChapter
  };
};

