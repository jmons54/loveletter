import { View } from 'react-native';
import type { GameParametersType } from '../types/gameType';
import { NumberOfPlayersSelector } from './numberOfPlayersSelector';
import { GameSettings } from './gameSettings';
import { playSound, setSoundEnabled } from '../utils/sound';

interface ParametersProps {
  value: GameParametersType;
  onChange: (value: GameParametersType) => void;
}

export function Parameters({ value, onChange }: ParametersProps) {
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
      />
    </View>
  );
}
