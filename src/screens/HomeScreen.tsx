import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, StatusBar, TouchableOpacity, Animated, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MOCK_BOOKS, Book } from '../constants/books';
import { Play, Plus, Trash2, Edit3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookStorage, BookProgress } from '../services/BookStorage';
import { AudiobookService } from '../services/AudiobookService';
import { AudioFileService } from '../services/AudioFileService';
import { ConversionService } from '../services/ConversionService';
import { Colors } from '../constants/colors';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const BookCard = ({ 
  item, 
  index, 
  onPress,
  onEdit,
  onDelete,
  progress
}: { 
  item: Book; 
  index: number; 
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  progress?: BookProgress;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, []);

  const progressPercent = progress ? (progress.position / progress.duration) * 100 : 0;
  const chapterCount = item.chapters ? item.chapters.length : 1;

  return (
    <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.coverUrl || 'https://via.placeholder.com/150' }} style={styles.cardCover} />
        <LinearGradient
          colors={[Colors.background.card, 'rgba(42,47,37,0.95)']} // Stone/Nature gradient
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.formatBadge}>
                <Text style={styles.formatText}>{chapterCount > 1 ? `${chapterCount} Ch` : 'Single'}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit3 size={14} color={Colors.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={14} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardAuthor} numberOfLines={1}>{item.author}</Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progressPercent)}% Played</Text>
            </View>

            <View style={styles.playButton}>
              <Play size={14} color={Colors.background.primary} fill={Colors.background.primary} />
              <Text style={styles.playText}>
                {progress && progressPercent > 0 ? 'Continue' : 'Listen Now'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<Record<string, BookProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const loadLibrary = async () => {
    try {
      setIsLoading(true);
      const userBooks = await BookStorage.getBooks();
      const allProgress = await BookStorage.getAllProgress();
      
      // Combine mock books with user books
      const combinedBooks = [...MOCK_BOOKS, ...userBooks];
      
      setBooks(combinedBooks);
      setProgress(allProgress);
    } catch (error) {
      console.error('Error loading library:', error);
      Alert.alert('Error', 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [])
  );

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState({ current: 0, total: 0, filename: '' });

  const handleAddBook = async () => {
    try {
      setIsAdding(true);
      const newBook = await AudiobookService.pickAudiobook();
      
      if (!newBook) {
        setIsAdding(false);
        return;
      }

      // Check for AWB files
      const hasAwbFiles = newBook.chapters.some(ch => ch.filename.toLowerCase().endsWith('.awb'));
      
      if (hasAwbFiles) {
        setIsAdding(false); // Stop adding spinner, start conversion UI
        setIsConverting(true);
        
        try {
          const convertedChapters = await ConversionService.convertChapters(
            newBook.chapters,
            (current, total, filename) => {
              setConversionProgress({ current, total, filename });
            }
          );
          
          newBook.chapters = convertedChapters;
          // Update audioUrl if it was pointing to an AWB file
          if (newBook.audioUrl && newBook.audioUrl.toLowerCase().endsWith('.awb')) {
             newBook.audioUrl = convertedChapters[0].uri;
          }
          
          await BookStorage.addBook(newBook);
          await loadLibrary();
          
          Alert.alert(
            '✅ Success', 
            `"${newBook.title}"\n\nConverted and added ${newBook.chapters.length} chapters!`
          );
        } catch (error) {
          console.error('Conversion error:', error);
          Alert.alert('Conversion Failed', 'Could not convert AWB files. The book was not added.');
        } finally {
          setIsConverting(false);
        }
      } else {
        // No conversion needed
        await BookStorage.addBook(newBook); // Ensure we save it (AudiobookService doesn't save anymore? Check this)
        // Actually AudiobookService DOES save it. But if we convert, we need to update it.
        // Wait, AudiobookService.pickAudiobook() calls BookStorage.addBook() internally.
        // If we convert, we need to UPDATE the book.
        // Let's modify logic:
        // 1. If AWB, we should probably NOT save it in AudiobookService, or we update it here.
        // Since AudiobookService saves it, we can just update it.
        
        if (hasAwbFiles) {
             await BookStorage.updateBook(newBook.id, newBook);
        }
        
        await loadLibrary();
        
        if (!hasAwbFiles) {
            Alert.alert(
                '✅ Success', 
                `"${newBook.title}"\n\nChapters: ${newBook.chapters.length}\n\nAdded to your library!`
            );
        }
      }
    } catch (error: any) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add audiobook. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      'Delete Audiobook',
      `Are you sure you want to delete "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Only delete if it's not a mock book
              if (!MOCK_BOOKS.find(b => b.id === book.id)) {
                await BookStorage.removeBook(book.id);
                
                // Delete audio file if it's local and single file (legacy)
                if (book.audioUrl && book.audioUrl.startsWith('file://')) {
                  await AudioFileService.deleteAudioFile(book.audioUrl);
                }
                // TODO: Delete chapter files if needed
              }
              
              await loadLibrary();
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete audiobook');
            }
          },
        },
      ]
    );
  };

  const handleEditBook = (book: Book) => {
    navigation.navigate('EditBook', { book });
  };

  const renderBookItem = ({ item, index }: { item: Book; index: number }) => (
    <BookCard 
      item={item} 
      index={index}
      onPress={() => navigation.navigate('Player', { book: item })}
      onEdit={() => handleEditBook(item)}
      onDelete={() => handleDeleteBook(item)}
      progress={progress[item.id]}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
      <LinearGradient
        colors={[Colors.background.primary, Colors.background.secondary, Colors.background.primary]}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Library</Text>
            <Text style={styles.headerSubtitle}>
              {books.length} {books.length === 1 ? 'audiobook' : 'audiobooks'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleAddBook}
            style={styles.addButton}
            activeOpacity={0.8}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color={Colors.background.primary} size="small" />
            ) : (
              <Plus size={24} color={Colors.background.primary} strokeWidth={3} />
            )}
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.accent.primary} size="large" />
            <Text style={styles.loadingText}>Loading library...</Text>
          </View>
        ) : (
          <FlatList
            data={books}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No audiobooks yet</Text>
                <Text style={styles.emptySubtext}>Tap + to add your first audiobook</Text>
              </View>
            }
          />
        )}
      </LinearGradient>
      {isConverting && (
        <View style={styles.conversionOverlay}>
          <View style={styles.conversionModal}>
            <ActivityIndicator size="large" color={Colors.accent.primary} />
            <Text style={styles.conversionTitle}>Converting Audiobook</Text>
            <Text style={styles.conversionSubtitle}>
              Chapter {conversionProgress.current} of {conversionProgress.total}
            </Text>
            <Text style={styles.conversionFilename} numberOfLines={1}>
              {conversionProgress.filename}
            </Text>
            <View style={styles.conversionProgressBarBg}>
              <View 
                style={[
                  styles.conversionProgressBar, 
                  { width: `${(conversionProgress.current / conversionProgress.total) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    letterSpacing: -0.5,
    fontFamily: 'serif', // Optional: adds to fantasy feel
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.nature.primary, // Olive green
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.nature.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listContent: {
    padding: 24,
    paddingTop: 10,
  },
  cardContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.background.card,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.1)', // Subtle gold border
  },
  cardCover: {
    width: 120,
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  formatBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  formatText: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(201,122,113,0.15)', // Error tint
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
    lineHeight: 24,
  },
  cardAuthor: {
    fontSize: 14,
    color: Colors.text.secondary, // Gold
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.nature.primary, // Olive green
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    bottom: 50,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.primary, // Gold
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playText: {
    color: Colors.background.primary, // Dark text on gold
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.muted,
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.text.muted,
    fontSize: 16,
  },
  conversionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  conversionModal: {
    backgroundColor: Colors.background.card,
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,184,150,0.2)',
  },
  conversionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  conversionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  conversionFilename: {
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 16,
  },
  conversionProgressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  conversionProgressBar: {
    height: '100%',
    backgroundColor: Colors.nature.primary,
  },
});

export default HomeScreen;
