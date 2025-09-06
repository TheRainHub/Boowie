import '../../global.css';
import { StatusBar } from 'expo-status-bar';
import { View, FlatList } from 'react-native';

import books from '../dummyBooks';
import BookListItem from '../components/BookListItem';

export default function App() {
  return (
    <View className='bg-slate-800 flex-1 justify-center p-4 pt-20'>
      <FlatList
        data={books}
        contentContainerClassName='gap-4'
        renderItem={({ item }) => <BookListItem book={item} />}
      />
      
      <StatusBar style="auto" />
    </View>
  );
}
