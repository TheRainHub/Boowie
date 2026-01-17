import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { Book, Chapter } from '../types';
import { BookStorage } from './BookStorage';

export const AudiobookService = {
  async pickAudiobook(): Promise<Book | null> {
    try {
      if (Platform.OS === 'android') {
        return this.pickAudiobookAndroid();
      } else {
        return this.pickAudiobookIOS();
      }
    } catch (error) {
      console.error('Error picking audiobook:', error);
      return null;
    }
  },

  async pickAudiobookAndroid(): Promise<Book | null> {
    const saf = (FileSystem as any).StorageAccessFramework;
    
    // StorageAccessFramework requires a custom dev client, not available in Expo Go
    if (!saf) {
      console.log('StorageAccessFramework not available, falling back to DocumentPicker');
      return this.pickAudiobookIOS(); // Use the same multi-select approach
    }
    
    const permissions = await saf.requestDirectoryPermissionsAsync();
    
    if (!permissions.granted) {
      return null;
    }

    const directoryUri = permissions.directoryUri;
    const files = await saf.readDirectoryAsync(directoryUri);
    
    // Filter for audio files
    const audioFiles = files.filter((uri: string) => 
      uri.endsWith('.mp3') || 
      uri.endsWith('.m4a') || 
      uri.endsWith('.aac') ||
      uri.endsWith('.wav') ||
      uri.endsWith('.awb') ||
      uri.endsWith('.m4b') // Also add m4b (audiobook format)
    );

    if (audioFiles.length === 0) {
      return null;
    }

    // Get folder name from URI for title
    const folderName = decodeURIComponent(directoryUri.split('%3A').pop()?.split('/').pop() || 'Unknown Album');
    
    const chapters: Chapter[] = audioFiles.map((uri: string, index: number) => {
      const filename = decodeURIComponent(uri.split('%2F').pop() || `Chapter ${index + 1}`);
      return {
        id: Math.random().toString(36).substr(2, 9),
        title: filename,
        uri: uri,
        filename: filename,
      };
    });

    // Natural sort chapters
    const sortedChapters = this.sortChapters(chapters);

    const newBook: Book = {
      id: Math.random().toString(36).substr(2, 9),
      title: folderName,
      author: 'Unknown Author', // User might need to edit this later
      chapters: sortedChapters,
      coverUrl: 'https://via.placeholder.com/300', // Default placeholder
      isLocal: true,
      // Legacy support
      audioUrl: sortedChapters[0]?.uri,
      thumbnailUrl: 'https://via.placeholder.com/300',
    };

    await BookStorage.addBook(newBook);
    return newBook;
  },

  async pickAudiobookIOS(): Promise<Book | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const chapters: Chapter[] = result.assets.map((asset, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: asset.name,
      uri: asset.uri,
      filename: asset.name,
    }));

    const sortedChapters = this.sortChapters(chapters);

    // Use first file's name or a generic name
    const bookTitle = sortedChapters[0].title.replace(/\.[^/.]+$/, ""); 

    const newBook: Book = {
      id: Math.random().toString(36).substr(2, 9),
      title: bookTitle,
      author: 'Unknown Author',
      chapters: sortedChapters,
      coverUrl: 'https://via.placeholder.com/300',
      isLocal: true,
      audioUrl: sortedChapters[0]?.uri,
      thumbnailUrl: 'https://via.placeholder.com/300',
    };

    await BookStorage.addBook(newBook);
    return newBook;
  },

  sortChapters(chapters: Chapter[]): Chapter[] {
    return chapters.sort((a, b) => {
      return a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' });
    });
  },
};
