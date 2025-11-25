import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAudioPlayerHook } from '../hooks/useAudioPlayer';
import { formatTime } from '../utils/formatTime';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Gauge } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;

const { width } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const PlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PlayerScreenRouteProp>();
  const { book } = route.params;
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  
  const { 
    isPlaying, 
    position, 
    duration, 
    playbackSpeed,
    togglePlayPause, 
    skipForward, 
    skipBackward,
    seekTo,
    changePlaybackSpeed,
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

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']}
      style={styles.container}
    >
      <Animated.View 
        style={[styles.header, { paddingTop: insets.top + 20, opacity: fadeAnim }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronDown color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity onPress={cyclePlaybackSpeed} activeOpacity={0.7} style={styles.speedButton}>
          <Gauge color="#fff" size={22} />
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
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
            colors={['transparent', 'rgba(0,0,0,0.2)']}
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
            minimumTrackTintColor="#ffffff"
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#ffffff"
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
            <SkipBack color="#fff" size={32} />
            <Text style={styles.skipText}>15s</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={togglePlayPause} 
            style={styles.playPauseButton}
            activeOpacity={0.85}
          >
            {isPlaying ? (
              <Pause color="#000" fill="#000" size={40} />
            ) : (
              <Play color="#000" fill="#000" size={40} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => skipForward()} 
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <SkipForward color="#fff" size={32} />
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
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.8,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  speedText: {
    color: '#fff',
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
    shadowColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
  },
  indicatorDotPlaying: {
    backgroundColor: '#4ade80',
  },
  indicatorText: {
    color: '#fff',
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  author: {
    fontSize: 17,
    color: '#999',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeRemainingText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
  },
  skipText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  playPauseButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoChipText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default PlayerScreen;
