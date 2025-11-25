import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { BookStorage } from '../services/BookStorage';
import { CoverGenerationService } from '../services/CoverGenerationService';
import { X, Save, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AudioFileService } from '../services/AudioFileService';

type EditBookRouteProp = RouteProp<RootStackParamList, 'EditBook'>;

const EditBookScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditBookRouteProp>();
  const { book } = route.params;

  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [description, setDescription] = useState(book.description || '');
  const [coverUrl, setCoverUrl] = useState(book.coverUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateCover = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title first');
      return;
    }

    try {
      setIsGenerating(true);
      const newCover = await CoverGenerationService.generateSmartCover(title);
      
      if (newCover) {
        setCoverUrl(newCover);
        Alert.alert('✨ Success', 'New cover generated!');
      } else {
        Alert.alert('Error', 'Could not generate cover');
      }
    } catch (error) {
      console.error('Error generating cover:', error);
      Alert.alert('Error', 'Failed to generate cover');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePickCover = async () => {
    try {
      const newCoverUri = await AudioFileService.pickCoverImage();
      if (newCoverUri) {
        setCoverUrl(newCoverUri);
        Alert.alert('✅ Success', 'Cover image updated!');
      }
    } catch (error) {
      console.error('Error picking cover:', error);
      Alert.alert('Error', 'Failed to pick cover image');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }

    try {
      setIsSaving(true);

      const updatedBook = {
        ...book,
        title: title.trim(),
        author: author.trim() || 'Unknown Author',
        description: description.trim(),
        coverUrl,
      };

      await BookStorage.updateBook(book.id, updatedBook);
      
      Alert.alert('✅ Saved', 'Book details updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving book:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#121212']} style={styles.gradientBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <X color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Book</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Save color="#000" size={20} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cover Section */}
          <View style={styles.coverSection}>
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
            
            <View style={styles.coverActions}>
              <TouchableOpacity 
                style={styles.coverActionButton}
                onPress={handleGenerateCover}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Sparkles color="#fff" size={20} />
                    <Text style={styles.coverActionText}>Generate AI Cover</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.coverActionButtonSecondary}
                onPress={handlePickCover}
              >
                <ImageIcon color="#fff" size={20} />
                <Text style={styles.coverActionText}>Pick Image</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Book title"
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                value={author}
                onChangeText={setAuthor}
                placeholder="Author name"
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Book description"
                placeholderTextColor="#555"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  coverSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  coverImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#222',
    marginBottom: 20,
  },
  coverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  coverActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  coverActionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  coverActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
});

export default EditBookScreen;
