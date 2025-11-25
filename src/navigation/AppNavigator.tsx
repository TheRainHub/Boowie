import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import EditBookScreen from '../screens/EditBookScreen';
import { Book } from '../constants/books';

export type RootStackParamList = {
  Home: undefined;
  Player: { book: Book };
  EditBook: { book: Book };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen 
          name="Player" 
          component={PlayerScreen} 
          options={{
            presentation: 'card',
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            cardStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen 
          name="EditBook" 
          component={EditBookScreen} 
          options={{
            presentation: 'modal',
            cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
