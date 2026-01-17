import { Book } from '../types';

export { Book };

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
    chapters: [
      {
        id: '1-1',
        title: 'Chapter 1',
        uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        filename: 'SoundHelix-Song-1.mp3',
        duration: 3600,
      }
    ],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Legacy
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    coverUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=800',
    chapters: [
      {
        id: '2-1',
        title: 'Chapter 1',
        uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Changed to MP3 for compatibility
        filename: 'SoundHelix-Song-2.mp3',
        duration: 4200,
      }
    ],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Legacy
  },
  {
    id: '3',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800',
    chapters: [
      {
        id: '3-1',
        title: 'Chapter 1',
        uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        filename: 'SoundHelix-Song-3.mp3',
        duration: 5000,
      }
    ],
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Legacy
  },
];
