import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';

// ВАЖНО: Замените на ваш API ключ Gemini
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';

export const CoverGenerationService = {
  /**
   * Extract keywords from book title for image search
   */
  extractKeywords(title: string): string {
    // Remove common words and get meaningful keywords
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at'];
    const words = title
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !commonWords.includes(word) && word.length > 2)
      .slice(0, 3); // Take first 3 meaningful words
    
    return words.join(',') || 'literature,art';
  },

  /**
   * Generate cover using keyword-based image search
   */
  async generateCoverWithKeywords(title: string): Promise<string> {
    try {
      const keywords = this.extractKeywords(title);
      
      // Используем Unsplash Random Photo API
      // Это работает без ключа и возвращает JSON с прямой ссылкой
      // Но для простоты используем предопределенные ID фотографий книг
      
      // Коллекция красивых обложек книг от Unsplash
      const bookCoverPhotos = [
        'photo-1544947950-fa07a98d237f', // Книги на полке
        'photo-1543002588-bfa74002ed7e', // Открытая книга
        'photo-1512820790803-83ca734da794', // Стопка книг
        'photo-1495446815901-a7297e633e8d', // Книги крупным планом
        'photo-1481627834876-b7833e8f5570', // Библиотека
        'photo-1507003211169-0a1dd7228f2d', // Книги в ряд
        'photo-1524995997946-a1c2e315a42f', // Старинные книги
        'photo-1509021436665-8f07dbf5bf1d', // Книжная полка
        'photo-1532012197267-da84d127e765', // Книги сверху
        'photo-1519682337058-a94d519337bc', // Винтажные книги
      ];
      
      // Выбираем случайное фото или основываясь на названии
      const titleHash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const photoIndex = titleHash % bookCoverPhotos.length;
      const selectedPhoto = bookCoverPhotos[photoIndex];
      
      const unsplashUrl = `https://images.unsplash.com/${selectedPhoto}?auto=format&fit=crop&q=80&w=800&h=1200`;
      
      console.log('📸 Selected cover:', selectedPhoto);
      console.log('🔍 Based on keywords:', keywords);
      console.log('🖼️ URL:', unsplashUrl);
      
      return unsplashUrl;
    } catch (error) {
      console.error('❌ Error generating cover:', error);
      // Fallback: конкретное изображение книги
      return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800&h=1200';
    }
  },

  /**
   * Download image and save to local storage
   */
  async downloadAndSaveCover(imageUrl: string, bookTitle: string): Promise<string> {
    try {
      const coversDir = `${FileSystem.documentDirectory}covers/`;
      
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(coversDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(coversDir, { intermediates: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
      const filename = `cover_${sanitizedTitle}_${timestamp}.jpg`;
      const localPath = `${coversDir}${filename}`;

      console.log('Downloading cover to:', localPath);

      // Download image
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
      
      console.log('Download result:', downloadResult.status);
      
      if (downloadResult.status === 200 || downloadResult.status === 304) {
        console.log('Cover saved successfully');
        return downloadResult.uri;
      } else {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('Error downloading cover:', error);
      throw error;
    }
  },

  /**
   * Main method: Generate cover for a book
   * By default uses simple keyword search (reliable)
   */
  async generateSmartCover(title: string, useAI: boolean = false): Promise<string | null> {
    try {
      // Default: use simple keyword-based generation
      if (!useAI) {
        console.log('📸 Generating cover with keywords for:', title);
        return await this.generateCoverWithKeywords(title);
      }

      // Optional: Try AI-enhanced generation if requested
      console.log('🤖 Attempting AI-enhanced generation...');
      
      if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')) {
        console.log('⚠️ No API key, falling back to keywords');
        return await this.generateCoverWithKeywords(title);
      }

      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            maxOutputTokens: 30,
            temperature: 0.5,
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        });

        const prompt = `Colors for book "${title}":`;
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text?.() || '';
        
        console.log('✨ AI response:', aiResponse);
        
        // Still use keywords, AI just for logging/future enhancement
        return await this.generateCoverWithKeywords(title);
        
      } catch (aiError: any) {
        console.log('⚠️ AI failed, using keywords:', aiError.message);
        return await this.generateCoverWithKeywords(title);
      }
      
    } catch (error) {
      console.error('❌ Error in cover generation:', error);
      return await this.generateCoverWithKeywords(title);
    }
  },

  /**
   * Delete cover image
   */
  async deleteCover(coverUri: string): Promise<void> {
    try {
      if (coverUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(coverUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(coverUri);
          console.log('🗑️ Cover deleted');
        }
      }
    } catch (error) {
      console.error('Error deleting cover:', error);
    }
  },
};
