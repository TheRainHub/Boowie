import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Book } from '../constants/books';

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  artwork?: string;
}

export const AudioFileService = {
  // Supported audio formats
  SUPPORTED_FORMATS: ['.mp3', '.awb', '.m4a', '.aac', '.wav', '.ogg'],

  // Pick audio file from device
  async pickAudioFile(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/mpeg',           // .mp3
          'audio/x-mpeg',         // .mp3
          'audio/mp3',            // .mp3
          'audio/amr-wb',         // .awb
          'audio/*',              // Other audio files
          'application/octet-stream', // Fallback
        ],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileName = file.name.toLowerCase();
        
        // Check if file has a supported extension
        const hasValidExtension = this.SUPPORTED_FORMATS.some(ext => 
          fileName.endsWith(ext)
        );
        
        if (!hasValidExtension) {
          throw new Error(
            `Unsupported file format. Please select: ${this.SUPPORTED_FORMATS.join(', ')}`
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error picking audio file:', error);
      throw error;
    }
  },

  // Copy file to app's document directory
  async copyFileToLibrary(sourceUri: string, fileName: string): Promise<string> {
    try {
      const libraryDir = `${FileSystem.documentDirectory}audiobooks/`;
      
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(libraryDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(libraryDir, { intermediates: true });
      }

      const destUri = `${libraryDir}${fileName}`;
      
      // Copy file
      await FileSystem.copyAsync({
        from: sourceUri,
        to: destUri,
      });

      return destUri;
    } catch (error) {
      console.error('Error copying file:', error);
      throw error;
    }
  },


  // Generate a book object from audio file
  async createBookFromFile(
    file: DocumentPicker.DocumentPickerAsset,
    generateAICover: boolean = true
  ): Promise<Book> {
    try {
      const bookId = `book_${Date.now()}`;
      const fileName = `${bookId}_${file.name}`;
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      const title = this.extractTitle(file.name);
      
      // Copy file to library
      const audioUri = await this.copyFileToLibrary(file.uri, fileName);

      // Generate or use default cover
      let coverUrl: string;
      
      if (generateAICover) {
        // Try to generate cover with keywords
        const { CoverGenerationService } = await import('./CoverGenerationService');
        const generatedCover = await CoverGenerationService.generateSmartCover(title, false); // false = no AI, just keywords
        coverUrl = generatedCover || this.getDefaultCoverForFormat(fileExtension);
      } else {
        coverUrl = this.getDefaultCoverForFormat(fileExtension);
      }

      // Create book object
      const book: Book = {
        id: bookId,
        title,
        author: 'Unknown Author',
        coverUrl,
        audioUrl: audioUri,
        duration: 0, // Will be updated when audio is loaded
        description: `${fileExtension.toUpperCase()} audiobook added from ${file.name}`,
      };

      return book;
    } catch (error) {
      console.error('Error creating book from file:', error);
      throw error;
    }
  },


  // Get default cover based on file format
  getDefaultCoverForFormat(extension: string): string {
    const covers: Record<string, string> = {
      mp3: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&q=80&w=800',
      awb: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=800',
      m4a: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
      default: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800',
    };
    
    return covers[extension] || covers.default;
  },

  // Extract title from filename
  extractTitle(filename: string): string {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Replace underscores and dashes with spaces
    const cleaned = nameWithoutExt.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    return cleaned
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  // Delete audio file
  async deleteAudioFile(audioUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(audioUri);
      }
    } catch (error) {
      console.error('Error deleting audio file:', error);
      throw error;
    }
  },

  // Pick cover image
  async pickCoverImage(): Promise<string | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const coverDir = `${FileSystem.documentDirectory}covers/`;
      
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(coverDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(coverDir, { intermediates: true });
      }

      const coverId = `cover_${Date.now()}.jpg`;
      const destUri = `${coverDir}${coverId}`;
      
      await FileSystem.copyAsync({
        from: asset.uri,
        to: destUri,
      });

      return destUri;
    } catch (error) {
      console.error('Error picking cover image:', error);
      return null;
    }
  },
};
