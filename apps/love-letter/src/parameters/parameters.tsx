import { StyleSheet, Text, View } from 'react-native';
import type { GameParametersType } from '../types/gameType';
import { NumberOfPlayersSelector } from './numberOfPlayersSelector';
import { GameSettings } from './gameSettings';
import {
  pauseCurrentMusic,
  playSound,
  resumeCurrentMusic,
  setMusicEnabled,
  setSoundEnabled,
} from '../utils/sound';
import { Button } from '../components/button';
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
        <Button
          onPress={() => {
            playSound('click');
            startNewGame();
          }}
        >
          <Text style={styles.buttonText}>{i18n.t('startNewGame')}</Text>
        </Button>
      </View>
      <GameSettings
        isAutoPlay={value.autoPlay}
        toggleAutoplay={() => {
          playSound('click');
          handleChange({ autoPlay: !value.autoPlay });
        }}
        isSoundEnabled={value.soundEnabled}
        toggleSound={() => {
          handleChange({ soundEnabled: !value.soundEnabled });
          setSoundEnabled(!value.soundEnabled);
          if (!value.soundEnabled) playSound('click');
        }}
        isMusicEnabled={value.musicEnabled}
        toggleMusic={async () => {
          playSound('click');
          handleChange({ musicEnabled: !value.musicEnabled });
          if (value.musicEnabled) {
            await pauseCurrentMusic();
          } else {
            await resumeCurrentMusic();
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
  buttonText: {
    color: '#fff',
    fontSize: 25,
    fontFamily: 'AmaticSCBold',
  },
});
