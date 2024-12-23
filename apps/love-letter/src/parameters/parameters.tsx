import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { GameParametersType } from '../types/gameType';
import { NumberOfPlayersSelector } from './numberOfPlayersSelector';
import { GameSettings } from './gameSettings';
import {
  pauseMusic,
  playSound,
  resumeMusic,
  setMusicEnabled,
  setSoundEnabled,
} from '../utils/sound';
import i18n from '@i18n';

interface ParametersProps {
  value: GameParametersType;
  onChange: (value: GameParametersType) => void;
  startNewGame: () => void;
}

export function Parameters({ value, onChange, startNewGame }: ParametersProps) {
  const handleChange = (data: Partial<GameParametersType>) => {
    onChange({ ...value, ...data });
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <NumberOfPlayersSelector
        value={value.numberOfPlayers}
        onChange={(numberOfPlayers) => {
          handleChange({ numberOfPlayers });
        }}
      />
      <View style={styles.container}>
        <TouchableOpacity onPress={startNewGame} style={styles.button}>
          <Text style={styles.buttonText}>{i18n.t('startNewGame')}</Text>
        </TouchableOpacity>
      </View>
      <GameSettings
        isAutoPlay={value.autoPlay}
        toggleAutoplay={() => {
          playSound('click');
          handleChange({ autoPlay: !value.autoPlay });
        }}
        isSoundEnabled={value.soundEnabled}
        toggleSound={() => {
          playSound('click');
          handleChange({ soundEnabled: !value.soundEnabled });
          setSoundEnabled(!value.soundEnabled);
        }}
        isMusicEnabled={value.musicEnabled}
        toggleMusic={async () => {
          playSound('click');
          handleChange({ musicEnabled: !value.musicEnabled });
          if (value.musicEnabled) {
            await pauseMusic();
          } else {
            await resumeMusic();
          }
          setMusicEnabled(!value.musicEnabled);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 100,
    alignItems: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#28a745',
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 25,
    fontFamily: 'AmaticSCBold',
  },
});
