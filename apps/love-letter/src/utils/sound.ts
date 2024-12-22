import { Audio } from 'expo-av';
import cardMove from '../../assets/sounds/card-move.wav';
import cardPlay from '../../assets/sounds/card-play.mp3';
import eliminated from '../../assets/sounds/eliminated.mp3';
import click from '../../assets/sounds/click.wav';
import select from '../../assets/sounds/select.wav';
import shuffle from '../../assets/sounds/shuffle.mp3';

let isSoundEnabled = true;

const sounds = {
  cardMove,
  cardPlay,
  click,
  select,
  eliminated,
  shuffle,
};

export function setSoundEnabled(value: boolean) {
  isSoundEnabled = value;
}

export function playSound(soundName: keyof typeof sounds) {
  if (!isSoundEnabled) return;
  const sound = new Audio.Sound();
  sound
    .loadAsync(sounds[soundName])
    .then(() => {
      return sound.playAsync();
    })
    .then(() => {
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    });
}

export function stopSound(soundName: keyof typeof sounds) {
  const sound = new Audio.Sound();
  sound.loadAsync(sounds[soundName]).then(() => {
    return sound.stopAsync();
  });
}
