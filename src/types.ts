export interface Chapter {
  id: string;
  title: string;
  uri: string;
  duration?: number;
  filename: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  chapters: Chapter[];
  audioUrl?: string; // Legacy support for single-file books
  thumbnailUrl?: string; // Legacy support
  isLocal?: boolean;
  description?: string;
  duration?: number;
}
