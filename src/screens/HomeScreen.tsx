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
import { AudioFileService } from '../services/AudioFileService';

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

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.bookCard}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.cardInner}>
          <Image source={{ uri: item.coverUrl }} style={styles.cover} />
          
          {/* Format Badge */}
          {item.audioUrl && (
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>
                {item.audioUrl.split('.').pop()?.toUpperCase() || 'AUDIO'}
              </Text>
            </View>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            <View style={styles.bookInfo}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
              
              {progress && progressPercent > 0 && (
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
                </View>
              )}
              
              <View style={styles.actionsRow}>
                <View style={styles.playButton}>
                  <Play size={14} color="#000" fill="#000" />
                  <Text style={styles.playText}>
                    {progress && progressPercent > 0 ? 'Continue' : 'Listen Now'}
                  </Text>
                </View>
                
                <View style={styles.iconActions}>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    style={styles.editButton}
                    activeOpacity={0.7}
                  >
                    <Edit3 size={14} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
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

  const handleAddBook = async () => {
    try {
      setIsAdding(true);
      const result = await AudioFileService.pickAudioFile();
      
      if (result.canceled) {
        setIsAdding(false);
        return;
      }

      const file = result.assets[0];
      const newBook = await AudioFileService.createBookFromFile(file);
      
      await BookStorage.addBook(newBook);
      await loadLibrary();
      
      const fileExt = file.name.split('.').pop()?.toUpperCase() || '';
      const hasCover = newBook.coverUrl.startsWith('file://');
      
      Alert.alert(
        '✅ Success', 
        `"${newBook.title}"\n\nFormat: ${fileExt}\n${hasCover ? '🎨 AI Cover Generated!' : 'Cover: Default'}\n\nAdded to your library!`
      );
    } catch (error: any) {
      console.error('Error adding book:', error);
      
      // Show specific error message if it's a format issue
      if (error.message && error.message.includes('Unsupported file format')) {
        Alert.alert(
          '❌ Unsupported Format',
          `${error.message}\n\nSupported formats:\n• MP3\n• AWB (Adaptive Multi-Rate Wideband)\n• M4A\n• AAC\n• WAV\n• OGG`
        );
      } else {
        Alert.alert('Error', 'Failed to add audiobook. Please try again.');
      }
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
                
                // Delete audio file if it's local
                if (book.audioUrl.startsWith('file://')) {
                  await AudioFileService.deleteAudioFile(book.audioUrl);
                }
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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0a0a0a', '#121212']}
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
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Plus size={24} color="#000" strokeWidth={3} />
            )}
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" size="large" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  bookCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  cardInner: {
    position: 'relative',
    height: 280,
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  formatBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  formatText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  bookInfo: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  author: {
    fontSize: 15,
    color: '#bbb',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 35,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
