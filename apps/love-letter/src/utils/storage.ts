import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserType } from '../types/userType';
import type { GameParametersType } from '../types/gameType';
import type { NumberOfPlayers } from '@shared';
import { GameEntity } from '@offline';
import { generateShortName } from '@shared';
import { avatars, getRandomAvatar } from './avatar';

export async function setUserData(data: UserType) {
  await AsyncStorage.setItem('userData', JSON.stringify(data));
}

export async function getUserData(): Promise<UserType | null> {
  let userData;
  try {
    const data = await AsyncStorage.getItem('userData');
    if (data) {
      userData = JSON.parse(data);
    }
  } catch {
    userData = null;
  }
  if (!userData) {
    userData = {
      id: new Date().getTime(),
      name: generateShortName(),
      avatar: getRandomAvatar(avatars),
    };
    await setUserData(userData);
  }
  return userData;
}

export async function setGameData(data: GameEntity | null) {
  await AsyncStorage.setItem('gameData', JSON.stringify(data));
}

export async function getGameData(): Promise<GameEntity | null> {
  try {
    const gameData = await AsyncStorage.getItem('gameData');
    return gameData ? JSON.parse(gameData) : null;
  } catch {
    return null;
  }
}

export async function setGameParametersData(data: GameParametersType) {
  await AsyncStorage.setItem('gameParametersData', JSON.stringify(data));
}

export async function getGameParametersData(): Promise<GameParametersType> {
  const defaultGameParametersData: GameParametersType = {
    soundEnabled: true,
    musicEnabled: true,
    numberOfPlayers: 4 as NumberOfPlayers,
    autoPlay: false,
  };

  let gameParametersData;
  try {
    const data = await AsyncStorage.getItem('gameParametersData');
    if (data) {
      gameParametersData = JSON.parse(data);
    }
  } catch {
    gameParametersData = null;
    await setGameParametersData(defaultGameParametersData);
  }

  return { ...defaultGameParametersData, ...gameParametersData };
}
