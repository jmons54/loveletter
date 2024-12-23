import { Audio } from 'expo-av';
import cardMove from '../../assets/sounds/card-move.wav';
import cardFlip from '../../assets/sounds/card-flip.wav';
import cardPlay from '../../assets/sounds/card-play.mp3';
import cardPlayed from '../../assets/sounds/card-played.mp3';
import eliminated from '../../assets/sounds/eliminated.mp3';
import click from '../../assets/sounds/click.wav';
import highlighted from '../../assets/sounds/highlighted.wav';
import select from '../../assets/sounds/select.wav';
import shuffle from '../../assets/sounds/shuffle.mp3';
import game from '../../assets/sounds/music-game.mp3';

const sounds = {
  cardMove,
  cardFlip,
  cardPlay,
  cardPlayed,
  click,
  highlighted,
  select,
  eliminated,
  shuffle,
};

const musics = {
  game,
};

let isSoundEnabled = false;
let isMusicEnabled = false;
let currentMusic: Audio.Sound | null = null;

export function setSoundEnabled(value: boolean) {
  isSoundEnabled = value;
}

export function setMusicEnabled(value: boolean) {
  isMusicEnabled = value;
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

export function playMusic(musicName: keyof typeof musics) {
  if (!isMusicEnabled) return;
  const sound = new Audio.Sound();
  sound
    .loadAsync(musics[musicName])
    .then(() => {
      currentMusic = sound;
      return sound.setVolumeAsync(0.2);
    })
    .then(() => {
      return sound.playAsync();
    })
    .then(() => {
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.replayAsync();
        }
      });
    });
}

export async function resumeMusic() {
  if (!currentMusic) return;
  const status = await currentMusic.getStatusAsync();
  if (status.isLoaded && !status.isPlaying) {
    await currentMusic.playAsync();
  }
}

export async function pauseMusic() {
  if (!currentMusic) return;
  const status = await currentMusic.getStatusAsync();
  if (status.isLoaded && status.isPlaying) {
    await currentMusic.pauseAsync();
  }
}

export async function stopMusic() {
  if (!currentMusic) return;
  await currentMusic.stopAsync();
}
