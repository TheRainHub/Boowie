import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Image } from 'react-native';

import book from './src/dummyBooks';
import BookListItem from './src/components/BookListItem';
 
export default function App() {
  return (
  <View className='bg-slate-800 flex-1 justify-center p-4'>
    <BookListItem book={book[0]}/>

    <StatusBar style="auto" />
    </View>
  );
 
}