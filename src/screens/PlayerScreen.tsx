import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Animated, Modal, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAudioPlayerHook } from '../hooks/useAudioPlayer';
import { formatTime } from '../utils/formatTime';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Timer, X, Gauge } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Colors } from '../constants/colors';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'Player'>;

const { width, height } = Dimensions.get('window');

const PLAYBACK_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const SLEEP_TIMER_OPTIONS = [5, 10, 15, 30, 45, 60];

const PlayerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<PlayerScreenRouteProp>();
  const { book } = route.params;
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const speedPanelWidth = useRef(new Animated.Value(0)).current;
  
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  
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
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

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

  const toggleSpeedPanel = () => {
    const toValue = showSpeedPanel ? 0 : 1;
    setShowSpeedPanel(!showSpeedPanel);
    
    Animated.spring(speedPanelWidth, {
      toValue,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleSelectSpeed = (speed: number) => {
    changePlaybackSpeed(speed);
    setTimeout(() => {
      if (showSpeedPanel) {
        toggleSpeedPanel();
      }
    }, 200);
  };

  const panelWidthInterpolated = speedPanelWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [90, width - 48],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1f1a', '#252a25', '#1a1f1a']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View 
        style={[
          styles.glowEffect,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.6],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(212,184,150,0.15)', 'rgba(107,142,35,0.15)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View 
        style={[styles.header, { paddingTop: insets.top + 20, opacity: fadeAnim }]}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
          style={styles.liquidGlassButton}
        >
          <View style={styles.liquidGlassInner}>
            <ChevronDown color={Colors.text.primary} size={24} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>NOW PLAYING</Text>
          {sleepTimerRemaining !== null && (
            <View style={styles.timerBadge}>
              <Timer size={12} color={Colors.nature.primary} />
              <Text style={styles.timerBadgeText}>{formatSleepTimer(sleepTimerRemaining)}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={handleToggleSleepTimer} 
          activeOpacity={0.7} 
          style={[
            styles.liquidGlassButton,
            sleepTimerMinutes ? styles.liquidGlassButtonActive : undefined
          ]}
        >
          <View style={styles.liquidGlassInner}>
            <Timer color={sleepTimerMinutes ? Colors.nature.primary : Colors.text.primary} size={20} />
          </View>
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
          <Animated.View 
            style={[
              styles.artworkFrame,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.liquidGlassFrame}>
              <Image source={{ uri: book.coverUrl }} style={styles.artwork} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.artworkGradient}
              />
            </View>
          </Animated.View>

          <View style={styles.playbackIndicator}>
            <View style={styles.liquidGlassIndicator}>
              <View style={[styles.indicatorDot, isPlaying && styles.indicatorDotPlaying]} />
              <Text style={styles.indicatorText}>
                {isPlaying ? 'Playing' : 'Paused'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.author}>{book.author}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.liquidGlassTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            <LinearGradient
              colors={['rgba(212,184,150,0.2)', 'rgba(212,184,150,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressGlow, { width: `${progress * 100}%` }]}
            />
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentPosition}
            onValueChange={handleSliderChange}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor={Colors.accent.primary}
          />
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentPosition / 1000)}</Text>
            <Text style={styles.timeRemainingText}>
              {formatTime(duration / 1000)}
            </Text>
          </View>
        </View>

        {/* Кнопки управления в новом стиле */}
        <View style={styles.controls}>
          {/* -10s button */}
          <TouchableOpacity 
            onPress={() => skipBackward()} 
            style={styles.controlButtonSecondary}
            activeOpacity={0.7}
          >
            <View style={styles.liquidGlassControlSecondary}>
              <Text style={styles.skipNumberText}>10</Text>
            </View>
          </TouchableOpacity>

          {/* Previous track button */}
          <TouchableOpacity 
            onPress={() => {/* TODO: Previous chapter */}} 
            style={styles.controlButtonSecondary}
            activeOpacity={0.7}
          >
            <View style={styles.liquidGlassControlSecondary}>
              <SkipBack color={Colors.text.primary} size={20} />
            </View>
          </TouchableOpacity>

          {/* Play/Pause button */}
          <TouchableOpacity 
            onPress={togglePlayPause} 
            style={styles.playPauseContainerNew}
            activeOpacity={0.9}
          >
            <View style={styles.liquidGlassPlayNew}>
              {isPlaying ? (
                <Pause color={Colors.accent.primary} size={28} />
              ) : (
                <Play color={Colors.accent.primary} fill={Colors.accent.primary} size={28} style={{ marginLeft: 2 }} />
              )}
            </View>
          </TouchableOpacity>

          {/* Next track button */}
          <TouchableOpacity 
            onPress={() => {/* TODO: Next chapter */}} 
            style={styles.controlButtonSecondary}
            activeOpacity={0.7}
          >
            <View style={styles.liquidGlassControlSecondary}>
              <SkipForward color={Colors.text.primary} size={20} />
            </View>
          </TouchableOpacity>

          {/* +10s button */}
          <TouchableOpacity 
            onPress={() => skipForward()} 
            style={styles.controlButtonSecondary}
            activeOpacity={0.7}
          >
            <View style={styles.liquidGlassControlSecondary}>
              <Text style={styles.skipNumberText}>10</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Раскрывающаяся панель скорости - расположена слева */}
        <View style={styles.speedContainer}>
          <Animated.View style={[styles.speedPanel, { width: panelWidthInterpolated }]}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.speedPanelContent}
              scrollEnabled={showSpeedPanel}
            >
              {!showSpeedPanel ? (
                <TouchableOpacity
                  onPress={toggleSpeedPanel}
                  activeOpacity={0.8}
                  style={styles.speedButtonCompact}
                >
                  <View style={styles.liquidGlassSpeedActive}>
                    <Gauge size={18} color={Colors.accent.primary} />
                    <Text style={styles.speedButtonCompactText}>{playbackSpeed}x</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <Animated.View
                      key={speed}
                      style={{
                        opacity: speedPanelWidth.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                        transform: [{
                          translateX: speedPanelWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                          }),
                        }],
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleSelectSpeed(speed)}
                        activeOpacity={0.8}
                        style={styles.speedButton}
                      >
                        <View style={playbackSpeed === speed ? styles.liquidGlassSpeedActive : styles.liquidGlassSpeed}>
                          <Text style={[
                            styles.speedOptionText,
                            playbackSpeed === speed && styles.speedOptionTextActive,
                          ]}>
                            {speed}x
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                  
                  <Animated.View
                    style={{
                      opacity: speedPanelWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    }}
                  >
                    <TouchableOpacity
                      onPress={toggleSpeedPanel}
                      activeOpacity={0.8}
                      style={styles.speedButton}
                    >
                      <View style={styles.liquidGlassSpeedClose}>
                        <X size={18} color={Colors.text.muted} />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Animated.View>

      <Modal
        visible={showSleepTimerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSleepTimerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.liquidGlassModal}>
            <View style={styles.modalBlur}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Timer size={24} color={Colors.accent.primary} />
                  <Text style={styles.modalTitle}>Sleep Timer</Text>
                </View>
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
                    <View style={styles.liquidGlassTimerOption}>
                      <Timer size={20} color={Colors.accent.primary} />
                      <Text style={styles.timerOptionText}>{minutes} minutes</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={() => setShowSleepTimerModal(false)}
              >
                <View style={styles.liquidGlassCancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f1a',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  liquidGlassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  liquidGlassButtonActive: {
    backgroundColor: 'rgba(107,142,35,0.15)',
    borderColor: 'rgba(107,142,35,0.3)',
  },
  liquidGlassInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,184,150,0.03)',
  },
  
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107,142,35,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(107,142,35,0.3)',
  },
  timerBadgeText: {
    color: Colors.nature.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  
  artworkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  artworkFrame: {
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  liquidGlassFrame: {
    width: width - 80,
    height: width - 80,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 2,
    borderColor: 'rgba(212,184,150,0.2)',
    padding: 4,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#222',
  },
  artworkGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 28,
  },
  
  playbackIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  liquidGlassIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,31,26,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.muted,
  },
  indicatorDotPlaying: {
    backgroundColor: Colors.nature.primary,
    shadowColor: Colors.nature.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  indicatorText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  author: {
    fontSize: 16,
    color: Colors.accent.primary,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  liquidGlassTrack: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.accent.primary,
    borderRadius: 3,
  },
  progressGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  timeText: {
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeRemainingText: {
    color: Colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  
  // Новые кнопки управления
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  controlButtonSecondary: {
    width: 52,
    height: 52,
  },
  liquidGlassControlSecondary: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  skipNumberText: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  
  playPauseContainerNew: {
    width: 72,
    height: 72,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  liquidGlassPlayNew: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  // Панель скорости - слева
  speedContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  speedPanel: {
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.15)',
  },
  speedPanelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  speedButtonCompact: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonCompactText: {
    color: Colors.accent.primary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  speedButton: {
    paddingHorizontal: 4,
  },
  liquidGlassSpeed: {
    width: 72,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidGlassSpeedActive: {
    width: 72,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(212,184,150,0.15)',
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    flexDirection: 'row',
  },
  liquidGlassSpeedClose: {
    width: 72,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedOptionText: {
    color: Colors.text.muted,
    fontSize: 16,
    fontWeight: '700',
  },
  speedOptionTextActive: {
    color: Colors.accent.primary,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  liquidGlassModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(47,52,47,0.95)',
    borderWidth: 2,
    borderColor: 'rgba(212,184,150,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  modalBlur: {
    backgroundColor: 'rgba(26,31,26,0.5)',
    padding: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    color: Colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    color: Colors.text.muted,
    fontSize: 14,
    marginBottom: 20,
    marginTop: 8,
  },
  timerOptions: {
    maxHeight: 320,
  },
  timerOption: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
  },
  liquidGlassTimerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.15)',
    borderRadius: 18,
  },
  timerOptionText: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cancelButton: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  liquidGlassCancelButton: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderRadius: 18,
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PlayerScreen;
