# 🎨 Boowie Design Update Guide
## Fantasy Nature Theme - Color Migration

Этот guide поможет обновить дизайн приложения под новую тему на основе иконки.

---

## 📋 Оглавление
1. [Цветовая палитра](#цветовая-палитра)
2. [Градиенты](#градиенты) 
3. [HomeScreen обновления](#homescreen)
4. [PlayerScreen обновления](#playerscreen)
5. [Общие компоненты](#общие-компоненты)

---

## 🎨 Цветовая палитра

### Импорт
```tsx
import { Colors } from '../constants/colors';
```

### Основные замены

#### **Фоны**
```tsx
// БЫЛО
backgroundColor: '#0a0a0a'  // Черный
backgroundColor: '#1a1a1a'  // Темно-серый

// СТАЛО
backgroundColor: Colors.background.primary    // '#1a1f1a' - Темный камень
backgroundColor: Colors.background.secondary  // '#252a25' - Светлый камень
backgroundColor: Colors.background.card       // '#2f342f' - Карточки
```

#### **Акцентные цвета**
```tsx
// БЫЛО
color: '#4ade80'           // Зеленый neon
backgroundColor: '#10b981' // Ярко-зеленый

// СТАЛО
color: Colors.accent.primary      // '#d4b896' - Золотистый
color: Colors.accent.secondary    // '#c9a771' - Глубокое золото
backgroundColor: Colors.nature.primary  // '#6b8e23' - Оливковый (для кнопок)
```

#### **Текст**
```tsx
// БЫЛО
color: '#fff'              // Белый
color: '#888'              // Серый
color: '#aaa'              // Светло-серый

// СТАЛО
color: Colors.text.primary    // '#f5e6d3' - Кремовый
color: Colors.text.muted      // '#a89b88' - Приглушенный беж
color: Colors.text.secondary  // '#d4b896' - Золотистый
```

#### **Успех/Ошибка/Предупреждение**
```tsx
// Успех (таймер, прогресс)
color: Colors.nature.primary    // '#6b8e23' - Оливковый

// Ошибка (удаление)
color: Colors.error            // '#c97a71' - Приглушенный красный
```

---

## 🌈 Градиенты

### LinearGradient замены

#### **Основной фон**
```tsx
// БЫЛО
<LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']}>

// СТАЛО
<LinearGradient colors={[
  Colors.background.primary,
  Colors.background.secondary,
  Colors.background.primary
]}>
// Или более природный вариант:
<LinearGradient colors={['#1a1f1a', '#2a2f25', '#1a1f1a']}>
```

#### **Карточки книг**
```tsx
// БЫЛО
<LinearGradient colors={['rgba(26,26,26,0.95)', 'rgba(38,38,38,0.95)']}>

// СТАЛО
<LinearGradient colors={[
  'rgba(47,52,47,0.95)',    // Colors.background.card с прозрачностью
  'rgba(42,47,37,0.95)'     // Слегка теплее
]}>
```

#### **Кнопки и акценты**
```tsx
// БЫЛО (Play button)
<LinearGradient colors={['#fff', '#e5e5e5']}>

// СТАЛО
<LinearGradient colors={[
  Colors.accent.primary,    // '#d4b896'
  Colors.accent.secondary   // '#c9a771'
]}>
```

#### **Модальные окна**
```tsx
// БЫЛО
backgroundColor: '#1a1a1a'

// СТАЛО
backgroundColor: Colors.background.card  // '#2f342f'
```

---

## 📱 HomeScreen

### Файл: `src/screens/HomeScreen.tsx`

#### 1. **Градиентный фон**
```tsx
// Строка ~250
<LinearGradient
  colors={[
    Colors.background.primary,
    Colors.background.secondary, 
    Colors.background.primary
  ]}
  style={styles.gradientBackground}
>
```

#### 2. **Заголовок**
```tsx
// Строка ~260
<Text style={styles.headerTitle}>
  My Audiobooks  // Или добавить emoji: 📚 My Library
</Text>

// В styles (строка ~300):
headerTitle: {
  color: Colors.text.primary,     // '#f5e6d3' вместо '#fff'
  // ... остальное
}
```

#### 3. **Счетчик книг**
```tsx
// Строка ~265
<View style={styles.bookCount}>
  <Text style={styles.bookCountText}>{library.length}</Text>
</View>

// В styles:
bookCount: {
  backgroundColor: Colors.nature.primary,  // '#6b8e23' вместо rgba(...)
  // ...
},
bookCountText: {
  color: Colors.text.primary,  // '#f5e6d3'
  // ...
}
```

#### 4. **Кнопка "+"**
```tsx
// Строка ~270
<TouchableOpacity style={styles.addButton}>
  <Plus size={28} color={Colors.text.primary} />  // Было '#fff'
</TouchableOpacity>

// В styles:
addButton: {
  backgroundColor: Colors.nature.primary,  // '#6b8e23'
  // ...
}
```

#### 5. **Карточки книг**
```tsx
// Строка ~50 (внутри BookCard)
<LinearGradient
  colors={[
    'rgba(47,52,47,0.95)',    // Каменный
    'rgba(42,47,37,0.95)'     // Теплее
  ]}
  style={styles.cardGradient}
>

// Название книги (строка ~60):
<Text style={styles.cardTitle}>{item.title}</Text>

// В styles:
cardTitle: {
  color: Colors.text.primary,  // '#f5e6d3' вместо '#fff'
  // ...
},
cardAuthor: {
  color: Colors.text.muted,    // '#a89b88' вместо '#aaa'
  // ...
}
```

#### 6. **Прогресс бар**
```tsx
// Строка ~75
<View style={[styles.progressBar, { width: `${progressPercent}%` }]} />

// В styles:
progressBar: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: Colors.nature.primary,  // '#6b8e23' вместо '#4ade80'
  // ...
}
```

#### 7. **Кнопка "Listen Now"**
```tsx
// Строка~90
<View style={styles.playButton}>
  <Play size={14} color={Colors.background.primary} fill={Colors.background.primary} />
  <Text style={styles.playText}>
    {progress && progressPercent > 0 ? 'Continue' : 'Listen Now'}
  </Text>
</View>

// В styles:
playButton: {
  backgroundColor: Colors.accent.primary,  // '#d4b896' золотой
  // ...
},
playText: {
  color: Colors.background.primary,  // '#1a1f1a' темный текст на золоте
  // ...
}
```

#### 8. **Кнопки Edit/Delete**
```tsx
// Edit button (строка ~100)
<TouchableOpacity style={styles.editButton}>
  <Edit3 size={14} color={Colors.text.primary} />  // Было '#fff'
</TouchableOpacity>

// Delete button (строка ~108)
<TouchableOpacity style={styles.deleteButton}>
  <Trash2 size={14} color={Colors.error} />  // '#c97a71' приглушенный красный
</TouchableOpacity>

// В styles:
editButton: {
  backgroundColor: 'rgba(212,184,150,0.15)',  // Золотистый с прозрачностью
  // ...
},
deleteButton: {
  backgroundColor: 'rgba(201,122,113,0.15)',  // Красноватый с прозрачностью
  // ...
}
```

---

## 🎵 PlayerScreen

### Файл: `src/screens/PlayerScreen.tsx`

#### 1. **Градиентный фон**
```tsx
// Строка ~104
<LinearGradient
  colors={[
    Colors.background.primary,
    Colors.background.secondary,
    Colors.background.primary
  ]}
  style={styles.container}
>
```

#### 2. **Header**
```tsx
// Иконка назад (строка ~112)
<ChevronDown color={Colors.text.primary} size={28} />  // Было '#fff'

// Текст "Now Playing" (строка ~117)
<Text style={styles.headerTitle}>Now Playing</Text>

// В styles:
headerTitle: {
  color: Colors.text.primary,  // '#f5e6d3'
  // ...
}
```

#### 3. **Таймер сна**
```tsx
// Timer badge (строка ~119)
<View style={styles.timerBadge}>
  <Timer size={12} color={Colors.nature.primary} />  // '#6b8e23'
  <Text style={styles.timerBadgeText}>{formatSleepTimer(sleepTimerRemaining)}</Text>
</View>

// В styles:
timerBadge: {
  backgroundColor: 'rgba(107,142,35,0.2)',  // nature.primary с прозрачностью
  // ...
},
timerBadgeText: {
  color: Colors.nature.primary,  // '#6b8e23'
  // ...
}
```

#### 4. **Кнопка таймера**
```tsx
// Активная кнопка (строка ~130)
<Timer color={sleepTimerMinutes ? Colors.nature.primary : Colors.text.primary} size={22} />

// В styles:
iconButtonActive: {
  backgroundColor: 'rgba(107,142,35,0.2)',  // Оливковый фон
  // ...
}
```

#### 5. **Кнопка скорости**
```tsx
// Строка ~135
<Gauge color={Colors.text.primary} size={22} />  // Было '#fff'
<Text style={styles.speedText}>{playbackSpeed}x</Text>

// В styles:
speedText: {
  color: Colors.text.primary,  // '#f5e6d3'
  // ...
},
speedButton: {
  backgroundColor: 'rgba(212,184,150,0.15)',  // Золотистый
  // ...
}
```

#### 6. **Индикатор воспроизведения**
```tsx
// Строка ~160
<View style={[styles.indicatorDot, isPlaying && styles.indicatorDotPlaying]} />

// В styles:
indicatorDot: {
  backgroundColor: Colors.text.muted,  // '#a89b88'
  // ...
},
indicatorDotPlaying: {
  backgroundColor: Colors.nature.primary,  // '#6b8e23' вместо '#4ade80'
  // ...
}
```

#### 7. **Slider (прогресс)**
```tsx
// Строка ~180
<Slider
  // ...
  minimumTrackTintColor={Colors.accent.primary}     // '#d4b896' золотой
  maximumTrackTintColor="rgba(212,184,150,0.2)"     // Золотой приглушенный
  thumbTintColor={Colors.accent.primary}            // '#d4b896'
/>
```

#### 8. **Время воспроизведения**
```tsx
// В styles:
timeText: {
  color: Colors.text.primary,  // '#f5e6d3'
  // ...
},
timeRemainingText: {
  color: Colors.text.muted,  // '#a89b88'
  // ...
}
```

#### 9. **Кнопки управления**
```tsx
// Skip buttons (строка ~200, 220)
<SkipBack color={Colors.text.primary} size={32} />   // Было '#fff'
<SkipForward color={Colors.text.primary} size={32} />

// Play button (строка ~210)
<TouchableOpacity style={styles.playPauseButton}>
  {isPlaying ? (
    <Pause color={Colors.background.primary} fill={Colors.background.primary} size={40} />
  ) : (
    <Play color={Colors.background.primary} fill={Colors.background.primary} size={40} />
  )}
</TouchableOpacity>

// В styles:
playPauseButton: {
  backgroundColor: Colors.accent.primary,  // '#d4b896' золотой
  // Можно добавить градиент для золотого блеска:
  // Обернуть в LinearGradient:
  // colors={[Colors.accent.light, Colors.accent.secondary]}
  // ...
}
```

#### 10. **Info chips**
```tsx
// В styles (строка ~465):
infoChip: {
  backgroundColor: 'rgba(212,184,150,0.1)',  // Золотистый
  borderColor: 'rgba(212,184,150,0.2)',      // Золотистый border
  // ...
},
infoChipText: {
  color: Colors.text.muted,  // '#a89b88'
  // ...
}
```

#### 11. **Sleep Timer Modal**
```tsx
// Modal overlay (строка ~248)
<View style={styles.modalOverlay}>  // Без изменений

// Modal content (строка~249)
<View style={styles.modalContent}>

// В styles:
modalContent: {
  backgroundColor: Colors.background.card,  // '#2f342f' каменный
  borderColor: 'rgba(212,184,150,0.2)',    // Золотой border
  // ...
},
modalTitle: {  
  color: Colors.text.primary,  // '#f5e6d3'
  // ...
},
modalSubtitle: {
  color: Colors.text.muted,  // '#a89b88'
 // ...
}
```

#### 12. **Timer options**
```tsx
// Градиент опций (строка ~267)
<LinearGradient
  colors={[
    'rgba(212,184,150,0.15)',    // Золотистый
    'rgba(201,167,113,0.1)'      // Теплое золото
  ]}
  style={styles.timerOptionGradient}
>
  <Timer size={20} color={Colors.nature.primary} />  // '#6b8e23'
  <Text style={styles.timerOptionText}>{minutes} minutes</Text>
</LinearGradient>

// В styles:
timerOptionText: {
  color: Colors.text.primary,  // '#f5e6d3'
  // ...
}
```

---

## 🎯 Общие компоненты

### StatusBar
```tsx
// В HomeScreen и PlayerScreen
<StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
```

### SafeAreaView
```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
```

---

## ✨ Дополнительные улучшения

### 1. **Добавить текстуру камня**
Можно добавить subtle pattern для фона:
```tsx
// В styles для container:
container: {
  flex: 1,
  backgroundColor: Colors.background.primary,
  // Опционально: добавить subtle noise texture через opacity
}
```

### 2. **Тени с природным оттенком**
```tsx
// Вместо черных теней:
shadowColor: Colors.background.primary,  // Каменный оттенок
shadowOpacity: 0.5,
```

### 3. **Иконки плюща** (опционально)
Можно добавить декоративные элементы плюща в углы:
```tsx
// В header HomeScreen:
<Text style={{ fontSize: 24, opacity: 0.3 }}>🍃</Text>
```

---

## 📝 Быстрый чеклист

### HomeScreen
- [ ] Импортировать Colors
- [ ] Обновить градиент фона (3 места)
- [ ] Заменить цвета текста (header, titles, authors)
- [ ] Обновить кнопку "+" (фон + иконка)
- [ ] Изменить прогресс бар на оливковый
- [ ] Кнопка "Listen Now" - золотой фон
- [ ] Edit/Delete кнопки - новые цвета

### PlayerScreen  
- [ ] Импортировать Colors
- [ ] Обновить градиент фона
- [ ] Header: иконки и текст
- [ ] Таймер сна: badge + кнопка (оливковый)
- [ ] Slider: золотой трек
- [ ] Индикатор Playing (оливковая точка)
- [ ] Кнопка Play - золотой фон
- [ ] Modal: фон карточки + опции
- [ ] Info chips - золотистые

---

## 🎨 Визуальный результат

После применения всех изменений:
- **Фон**: Тёмно-зелёный каменный (#1a1f1a)
- **Акценты**: Золотистый беж (#d4b896) 
- **Активные элементы**: Оливковый (#6b8e23)
- **Текст**: Кремовый (#f5e6d3)
- **Общая атмосфера**: Fantasy библиотека с каменными стенами и золотыми акцентами

---

Успехов в обновлении! 🌿✨📚
