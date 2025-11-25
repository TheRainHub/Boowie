import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Animated, Modal, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAudioPlayerHook } from '../hooks/useAudioPlayer';
import { formatTime } from '../utils/formatTime';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Gauge, Timer, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/colors';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;

const { width } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 45, 60]; // minutes

const PlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PlayerScreenRouteProp>();
  const { book } = route.params;
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  
  const { 
    isPlaying, 
    position, 
    duration, 
    playbackSpeed,
    sleepTimerMinutes,
    sleepTimerRemaining,
    togglePlayPause, 
    skipForward, 
    skipBackward,
    seekTo,
    changePlaybackSpeed,
    setSleepTimer,
    cancelSleepTimer,
    loadAudio 
  } = useAudioPlayerHook(book.audioUrl, book.id);

  useEffect(() => {
    loadAudio();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, []);

  const progress = duration > 0 ? position / duration : 0;
  const currentPosition = isSeeking ? seekPosition : position;

  const handleSliderChange = (value: number) => {
    setIsSeeking(true);
    setSeekPosition(value);
  };

  const handleSlidingComplete = (value: number) => {
    setIsSeeking(false);
    seekTo(value);
  };

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    changePlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  };

  const formatSleepTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetSleepTimer = (minutes: number) => {
    setSleepTimer(minutes);
    setShowSleepTimerModal(false);
  };

  const handleToggleSleepTimer = () => {
    if (sleepTimerMinutes) {
      cancelSleepTimer();
    } else {
      setShowSleepTimerModal(true);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.background.primary, Colors.background.secondary, Colors.background.primary]}
      style={styles.container}
    >
      <Animated.View 
        style={[styles.header, { paddingTop: insets.top + 20, opacity: fadeAnim }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronDown color={Colors.text.primary} size={28} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Now Playing</Text>
          {sleepTimerRemaining !== null && (
            <View style={styles.timerBadge}>
              <Timer size={12} color={Colors.nature.primary} />
              <Text style={styles.timerBadgeText}>{formatSleepTimer(sleepTimerRemaining)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleToggleSleepTimer} 
            activeOpacity={0.7} 
            style={[styles.iconButton, sleepTimerMinutes ? styles.iconButtonActive : null]}
          >
            <Timer color={sleepTimerMinutes ? Colors.nature.primary : Colors.text.primary} size={22} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={cyclePlaybackSpeed} activeOpacity={0.7} style={styles.speedButton}>
            <Gauge color={Colors.text.primary} size={22} />
            <Text style={styles.speedText}>{playbackSpeed}x</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.artworkContainer}>
          <Image source={{ uri: book.coverUrl }} style={styles.artwork} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)']}
            style={styles.artworkGradient}
          />
          
          {/* Playback State Indicator */}
          <View style={styles.playbackIndicator}>
            <View style={[styles.indicatorDot, isPlaying && styles.indicatorDotPlaying]} />
            <Text style={styles.indicatorText}>
              {isPlaying ? 'Playing' : 'Paused'}
            </Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
        </View>

        <View style={styles.progressContainer}>
          {/* Interactive Slider */}
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentPosition}
            onValueChange={handleSliderChange}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor={Colors.accent.primary}
            maximumTrackTintColor="rgba(212,184,150,0.2)"
            thumbTintColor={Colors.accent.primary}
          />
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentPosition / 1000)}</Text>
            <Text style={styles.timeRemainingText}>
              -{formatTime((duration - currentPosition) / 1000)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            onPress={() => skipBackward()} 
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <SkipBack color={Colors.text.primary} size={32} />
            <Text style={styles.skipText}>15s</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={togglePlayPause} 
            style={styles.playPauseButton}
            activeOpacity={0.85}
          >
            {isPlaying ? (
              <Pause color={Colors.background.primary} fill={Colors.background.primary} size={40} />
            ) : (
              <Play color={Colors.background.primary} fill={Colors.background.primary} size={40} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => skipForward()} 
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <SkipForward color={Colors.text.primary} size={32} />
            <Text style={styles.skipText}>15s</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              {formatTime(duration / 1000)} total
            </Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              {Math.round(progress * 100)}% complete
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Sleep Timer Modal */}
      <Modal
        visible={showSleepTimerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSleepTimerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⏰ Sleep Timer</Text>
              <TouchableOpacity onPress={() => setShowSleepTimerModal(false)} activeOpacity={0.7}>
                <X color={Colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>Playback will stop after:</Text>
            
            <ScrollView style={styles.timerOptions} showsVerticalScrollIndicator={false}>
              {SLEEP_TIMER_OPTIONS.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={styles.timerOption}
                  activeOpacity={0.8}
                  onPress={() => handleSetSleepTimer(minutes)}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={styles.timerOptionGradient}
                  >
                    <Timer size={20} color={Colors.nature.primary} />
                    <Text style={styles.timerOptionText}>{minutes} minutes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={() => setShowSleepTimerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,184,150,0.15)', // Golden tint
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  speedText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-around',
    paddingBottom: 40,
  },
  artworkContainer: {
    alignItems: 'center',
    shadowColor: Colors.background.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  artwork: {
    width: width - 80,
    height: width - 80,
    borderRadius: 24,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.1)', // Subtle gold border
  },
  artworkGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 24,
  },
  playbackIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,31,26,0.8)', // Dark stone
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.muted,
  },
  indicatorDotPlaying: {
    backgroundColor: Colors.nature.primary, // Olive green
  },
  indicatorText: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  author: {
    fontSize: 18,
    color: Colors.text.secondary, // Gold
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  timeText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeRemainingText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginTop: 10,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  skipText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent.primary, // Gold
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  infoChip: {
    backgroundColor: 'rgba(212,184,150,0.08)', // Golden tint
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.15)',
  },
  infoChipText: {
    color: Colors.text.muted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(107,142,35,0.2)', // Olive tint
    borderWidth: 1,
    borderColor: 'rgba(107,142,35,0.3)',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107,142,35,0.15)', // Olive tint
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(107,142,35,0.2)',
  },
  timerBadgeText: {
    color: Colors.nature.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.background.card, // Stone card
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.2)', // Gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'serif', // Optional: adds to fantasy feel
  },
  modalSubtitle: {
    color: Colors.text.muted,
    fontSize: 14,
    marginBottom: 16,
  },
  timerOptions: {
    maxHeight: 300,
  },
  timerOption: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  timerOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  timerOptionText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerScreen;
