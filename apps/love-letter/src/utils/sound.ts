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
import success from '../../assets/sounds/success.mp3';
import fail from '../../assets/sounds/fail.wav';
import game from '../../assets/sounds/music-game.mp3';
import targeted from '../../assets/sounds/music-targeted.wav';

type SoundName = keyof typeof sounds;
type MusicName = keyof typeof musics;

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
  targeted,
  fail,
  success,
};

const musics = {
  game,
  targeted,
};

let isSoundEnabled = false;
let isMusicEnabled = false;
let currentMusic: MusicName | null = null;

const loadedSounds = new Map<SoundName, Audio.Sound>();
const loadedMusics = new Map<MusicName, Audio.Sound>();
const currentMusics = new Map<MusicName, Audio.Sound>();

Promise.all([preloadMusics(), preloadSounds()]).then(() => {
  return setGlobalMusicVolume(0.2);
});

export async function preloadSounds() {
  await Promise.all(
    Object.entries(sounds).map(async ([key, name]) => {
      const sound = new Audio.Sound();
      await sound.loadAsync(name);
      loadedSounds.set(key as SoundName, sound);
    })
  );
}

export async function preloadMusics() {
  await Promise.all(
    Object.entries(musics).map(async ([key, name]) => {
      const music = new Audio.Sound();
      await music.loadAsync(name);
      loadedMusics.set(key as MusicName, music);
    })
  );
}

export function setSoundEnabled(value: boolean) {
  isSoundEnabled = value;
}

export function setMusicEnabled(value: boolean) {
  isMusicEnabled = value;
}

export async function setGlobalMusicVolume(volume: number) {
  for (const music of loadedMusics.values()) {
    await music.setVolumeAsync(volume);
  }
}

export function playSound(soundName: SoundName) {
  if (!isSoundEnabled) return;
  return loadedSounds.get(soundName)?.replayAsync();
}

export function stopSound(soundName: SoundName) {
  return loadedSounds.get(soundName)?.stopAsync();
}

export function playMusic(musicName: MusicName) {
  currentMusic = musicName;
  if (!isMusicEnabled) return;
  const music = loadedMusics.get(musicName);
  return loadedMusics
    .get(musicName)
    ?.replayAsync()
    .then(() => {
      return music?.setIsLoopingAsync(true);
    })
    .then(() => {
      currentMusics.set(musicName, music as Audio.Sound);
      return music?.getStatusAsync();
    });
}

export async function resumeMusic(musicName: MusicName) {
  currentMusic = musicName;
  if (!currentMusics.has(musicName)) {
    playMusic(musicName);
  } else {
    const music = currentMusics.get(musicName);
    const status = await music?.getStatusAsync();
    if (status?.isLoaded && !status.isPlaying) {
      await music?.playAsync();
    }
  }
}

export async function pauseMusic(musicName: MusicName) {
  if (!currentMusics.has(musicName)) return;
  const music = currentMusics.get(musicName);
  const status = await music?.getStatusAsync();
  if (status?.isLoaded && status.isPlaying) {
    await music?.pauseAsync();
  }
}

export async function stopAllMusic() {
  for (const music of currentMusics.values()) {
    await music?.stopAsync();
  }
}

export async function stopMusic(musicName: keyof typeof musics = 'game') {
  if (!currentMusics.has(musicName)) return;
  const music = currentMusics.get(musicName);
  const status = await music?.getStatusAsync();
  if (status?.isLoaded && status.isPlaying) {
    await music?.stopAsync();
  }
}

export async function resumeCurrentMusic() {
  if (!currentMusic) return;
  await resumeMusic(currentMusic);
}

export async function pauseCurrentMusic() {
  if (!currentMusic) return;
  await pauseMusic(currentMusic);
}
