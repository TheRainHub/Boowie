import { Text, View, Image } from 'react-native';
import {AntDesign} from '@expo/vector-icons';

type Book = {
    id: string;
    title: string;
    author: string;
    audio_url: string;
    thumbnail_url: string;
}

type BookListItemProps = {
    book: Book;
}

export default function BookListItem({ book }: BookListItemProps) {
   return (
      <View className='flex-row'>
        <Image
         source={{uri: book.thumbnail_url}} 
         className='w-16 aspect-square' />
        <View className='gap-1 flex-1'>
          <Text className='text-2xl text-gray-100 font-bold'>{book.title}</Text>
          <Text className='text-gray-400 font-medium'>{book.author}</Text>
        </View>

        <AntDesign name='playcircleo' size={24} color="gainsboro" />
      </View>
  );
}