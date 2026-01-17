import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../types';

const BOOKS_KEY = '@audiobooks_library';
const PROGRESS_KEY = '@audiobooks_progress';

export interface BookProgress {
  bookId: string;
  position: number; // in milliseconds
  duration: number;
  lastPlayed: number; // timestamp
  currentChapter?: number;
}

export const BookStorage = {
  // Get all books
  async getBooks(): Promise<Book[]> {
    try {
      const data = await AsyncStorage.getItem(BOOKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  },

  // Add a new book
  async addBook(book: Book): Promise<void> {
    try {
      const books = await this.getBooks();
      const updatedBooks = [...books, book];
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  },

  // Remove a book
  async removeBook(bookId: string): Promise<void> {
    try {
      const books = await this.getBooks();
      const updatedBooks = books.filter(b => b.id !== bookId);
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
      
      // Also remove progress
      await this.removeProgress(bookId);
    } catch (error) {
      console.error('Error removing book:', error);
      throw error;
    }
  },

  // Update book
  async updateBook(bookId: string, updates: Partial<Book>): Promise<void> {
    try {
      const books = await this.getBooks();
      const updatedBooks = books.map(b => 
        b.id === bookId ? { ...b, ...updates } : b
      );
      await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(updatedBooks));
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  },

  // Progress management
  async getProgress(bookId: string): Promise<BookProgress | null> {
    try {
      const data = await AsyncStorage.getItem(`${PROGRESS_KEY}_${bookId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  },

  async saveProgress(progress: BookProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${PROGRESS_KEY}_${progress.bookId}`,
        JSON.stringify({ ...progress, lastPlayed: Date.now() })
      );
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  },

  async removeProgress(bookId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${PROGRESS_KEY}_${bookId}`);
    } catch (error) {
      console.error('Error removing progress:', error);
    }
  },

  // Get all progress data
  async getAllProgress(): Promise<Record<string, BookProgress>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith(PROGRESS_KEY));
      const progressData = await AsyncStorage.multiGet(progressKeys);
      
      const result: Record<string, BookProgress> = {};
      progressData.forEach(([key, value]) => {
        if (value) {
          const progress = JSON.parse(value);
          result[progress.bookId] = progress;
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error loading all progress:', error);
      return {};
    }
  },
};
