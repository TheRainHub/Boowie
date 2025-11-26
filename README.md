# 🎧 Boowie - Premium Audiobook Player

Boowie is a modern, feature-rich audiobook player built with **React Native** and **Expo**. It combines a premium **"Fantasy Nature"** aesthetic (stone, gold, ivy) with powerful playback controls and AI-enhanced library management.

bd55d4e5-ea10-47c0-bfa9-2e9fa624a882.png
## ✨ Key Features

### 🎧 Advanced Playback
- **Format Support**: Plays MP3, AWB, M4A, AAC, WAV, OGG.
- **Sleep Timer**: Fall asleep to your favorite stories with a customizable timer (5, 10, 15, 30, 45, 60 mins).
- **Variable Speed**: Adjust playback speed from 0.5x to 2.0x.
- **Background Playback**: Continue listening while using other apps or when the screen is off.
- **Smart Progress**: Automatically saves your position for every book.
- **Interactive Controls**: Smooth slider for seeking, skip forward/backward buttons.

### 📚 Library Management
- **Easy Import**: Import audiobooks directly from your device's file system.
- **Metadata Editing**: Edit book titles, authors, and descriptions.
- **Format Detection**: Automatically detects and displays file formats (MP3, AWB, etc.).
- **Progress Tracking**: Visual progress bars for each book in your library.

### 🎨 AI & Design
- **Fantasy Nature Theme**: A unique visual style inspired by ancient stone, warm gold, and organic greens.
- **Smart Covers**: Automatically generates cover art based on book titles using keyword analysis (powered by Unsplash).
- **Gemini AI Integration**: Optional advanced cover generation using Google's Gemini API.
- **Premium UI**: Smooth animations, gradients, and glassmorphism effects using `expo-linear-gradient` and `react-native-reanimated`.

## 🛠 Tech Stack

- **React Native** - Cross-platform development
- **Expo SDK 54** - Modern development workflow
- **TypeScript** - Type-safe code
- **expo-audio** - Next-gen audio API
- **expo-file-system** - Local file management
- **AsyncStorage** - Data persistence
- **Lucide React Native** - Beautiful vector icons
- **@google/generative-ai** - AI integration

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/boowie.git
   cd boowie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the app**
   ```bash
   npx expo start
   ```

## 🎯 Usage

### Adding an Audiobook
1. Tap the `+` button on the Home screen.
2. Select an audio file from your device.
3. The app will automatically generate a cover and add the book to your library.

### Using the Sleep Timer
1. Open the player for any book.
2. Tap the **Timer** icon in the header.
3. Select a duration (e.g., 15 minutes).
4. The timer will count down and stop playback automatically.

### AI Cover Generation (Optional)
To enable advanced AI cover generation with Gemini:
1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
2. Open `src/services/CoverGenerationService.ts`.
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your key.

## 📁 Project Structure

```
Boowie/
├── src/
│   ├── constants/        # Theme colors, mock data
│   ├── hooks/            # Custom hooks (useAudioPlayer)
│   ├── navigation/       # Stack navigator configuration
│   ├── screens/          # Home, Player, EditBook screens
│   ├── services/         # Audio, Storage, AI services
│   └── utils/            # Helper functions
├── App.tsx               # Root component
└── app.json              # Expo configuration
```

## 📝 License

MIT License - feel free to use and modify!

---

**Happy Listening! 📖🎧**
