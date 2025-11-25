# 🎨 Quick Start - Color Update

## Импорт
```tsx
import { Colors } from '../constants/colors';
```

## Основные замены (Find & Replace)

### 1. Фоны
```
'#0a0a0a'  →  Colors.background.primary
'#1a1a1a'  →  Colors.background.secondary  
'#2a2a2a'  →  Colors.background.card
```

### 2. Текст
```
color: '#fff'  →  color: Colors.text.primary
color: '#888'  →  color: Colors.text.muted
color: '#aaa'  →  color: Colors.text.muted
```

### 3. Акценты (зеленый → золотой/оливковый)
```
'#4ade80'  →  Colors.nature.primary    (кнопки, прогресс)
'#10b981'  →  Colors.accent.primary     (фоны)
```

### 4. Градиенты
```tsx
// БЫЛО:
colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']}

// СТАЛО:
colors={[Colors.background.primary, Colors.background.secondary, Colors.background.primary]}
```

## Приоритетные изменения

### 🏠 HomeScreen (5 мин)
1. Кнопка "+": `backgroundColor: Colors.nature.primary`
2. Прогресс бар: `backgroundColor: Colors.nature.primary`
3. "Listen Now": `backgroundColor: Colors.accent.primary`
4. Градиент фона: использовать `Colors.background.*`

### 🎵 PlayerScreen (5 мин)
1. Play button: `backgroundColor: Colors.accent.primary`
2. Slider: `minimumTrackTintColor: Colors.accent.primary`
3. Timer badge: `color: Colors.nature.primary`
4. Индикатор playing: `backgroundColor: Colors.nature.primary`

## Цветовая палитра

```tsx
// Природа (кнопки, прогресс, таймер)
Colors.nature.primary    // '#6b8e23' - Оливковый

// Золото (акценты, Play button)
Colors.accent.primary    // '#d4b896' - Золотистый
Colors.accent.secondary  // '#c9a771' - Глубокое золото

// Фоны
Colors.background.primary    // '#1a1f1a' - Темный камень
Colors.background.secondary  // '#252a25' - Светлый камень  
Colors.background.card       // '#2f342f' - Карточки

// Текст
Colors.text.primary    // '#f5e6d3' - Кремовый
Colors.text.muted      // '#a89b88' - Приглушенный
```

Полный guide: `DESIGN_UPDATE_GUIDE.md`
