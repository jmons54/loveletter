import { useEffect, useState } from 'react';
import { GameEntity } from '@offline';
import type { UserType } from '../types/userType';
import { avatars, getRandomAvatar } from '../utils/avatar';
import { useFonts } from 'expo-font';
import AmaticSC from '../../assets/fonts/AmaticSC-Regular.ttf';
import AmaticSCBold from '../../assets/fonts/AmaticSC-Bold.ttf';
import * as NavigationBar from 'expo-navigation-bar';
import { getGameParametersData, getUserData } from '../utils/storage';
import { setMusicEnabled, setSoundEnabled } from '../utils/sound';
import type { GameParametersType } from '../types/gameType';

NavigationBar.setBackgroundColorAsync('#000').then();

export function useInit(game: GameEntity | null) {
  const [user, setUser] = useState<UserType | null>(null);
  const [gameParameters, setGameParameters] =
    useState<GameParametersType | null>(null);

  useFonts({
    AmaticSC,
    AmaticSCBold,
  });

  useEffect(() => {
    getUserData().then((data) => {
      setUser(data);
    });
  }, []);

  useEffect(() => {
    getGameParametersData().then((data) => {
      setSoundEnabled(data.soundEnabled);
      setMusicEnabled(data.musicEnabled);
      setGameParameters(data);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const player = game?.players.find((player) => player.id === user.id);
    if (player) {
      player.name = user.name;
      player.avatar = user.avatar;
      const bot = game?.players.find(
        (player) => player.isBot && player.avatar === user.avatar
      );
      if (bot) {
        bot.avatar = getRandomAvatar(
          avatars.filter(
            (avatar) => !game?.players.find((p) => p.avatar === avatar)
          )
        );
      }
    }
  }, [user, game?.players]);

  return { user, gameParameters, setGameParameters };
}
