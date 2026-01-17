import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Chapter } from '../types';

export const ConversionService = {
  async convertFile(sourceUri: string, outputFilename: string): Promise<string> {
    const outputDir = `${FileSystem.documentDirectory}converted/`;
    const outputPath = `${outputDir}${outputFilename}`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(outputDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
    }

    // FFmpeg requires a local path. If it's a content:// URI, we might need to copy it first.
    // However, ffmpeg-kit often handles content URIs directly on Android.
    // Let's try direct first, if fails, we copy.
    
    // Command: -i input -c:a libmp3lame -q:a 2 output.mp3
    // -y to overwrite output
    const command = `-y -i "${sourceUri}" -c:a libmp3lame -q:a 2 "${outputPath}"`;
    
    console.log(`Starting conversion: ${command}`);
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      console.log(`Conversion successful: ${outputPath}`);
      return outputPath;
    } else {
      const logs = await session.getLogs();
      const logContent = logs.map(log => log.getMessage()).join('\n');
      console.error(`Conversion failed logs: ${logContent}`);
      throw new Error('FFmpeg conversion failed');
    }
  },

  async convertChapters(
    chapters: Chapter[], 
    onProgress: (current: number, total: number, filename: string) => void
  ): Promise<Chapter[]> {
    const convertedChapters: Chapter[] = [];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      // Only convert if it's an AWB file
      if (chapter.filename.toLowerCase().endsWith('.awb')) {
        onProgress(i + 1, chapters.length, chapter.filename);
        
        try {
          const newFilename = chapter.filename.replace(/\.awb$/i, '.mp3');
          const newUri = await this.convertFile(chapter.uri, newFilename);
          
          convertedChapters.push({
            ...chapter,
            uri: newUri,
            filename: newFilename,
            title: chapter.title // Keep original title
          });
        } catch (error) {
          console.error(`Failed to convert chapter ${chapter.filename}`, error);
          // If conversion fails, keep original (better than nothing, though seek won't work)
          convertedChapters.push(chapter);
        }
      } else {
        convertedChapters.push(chapter);
      }
    }

    return convertedChapters;
  }
};
