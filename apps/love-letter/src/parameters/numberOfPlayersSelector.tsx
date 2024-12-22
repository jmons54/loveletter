import { View, Text, StyleSheet, Pressable } from 'react-native';
import { playSound } from '../utils/sound';
import type { NumberOfPlayers } from '@shared';
import i18n from '@i18n';
import { activeColor } from '../utils/color';

interface NumberOfPlayersSelectorProps {
  value: NumberOfPlayers;
  onChange: (value: NumberOfPlayers) => void;
}

export const NumberOfPlayersSelector = ({
  value,
  onChange,
}: NumberOfPlayersSelectorProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('numberOfPlayers')}</Text>
      <View style={styles.buttonContainer}>
        {[2, 3, 4, 5, 6].map((num) => (
          <Pressable
            key={num}
            onPress={() => {
              playSound('click');
              onChange(num as NumberOfPlayers);
            }}
            style={[styles.button, value === num && styles.selectedButton]}
          >
            <Text style={styles.buttonText}>{num}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    marginBottom: 16,
    fontFamily: 'AmaticSC',
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: activeColor,
  },
  buttonText: {
    color: '#fff',
    fontSize: 25,
    fontFamily: 'AmaticSCBold',
    textAlign: 'center',
  },
});
