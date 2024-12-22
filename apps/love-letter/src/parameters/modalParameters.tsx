import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { GameParametersType } from '../types/gameType';
import type { UserType } from '../types/userType';
import { useState } from 'react';
import i18n from '@i18n';
import { Parameters } from './parameters';
import { ModalTabs } from '../components/modalTabs';

interface ModalParametersProps {
  user: UserType;
  isVisible: boolean;
  onClose: () => void;
  startNewGame: () => void;
  gameParameters: GameParametersType;
  onGameParametersChange: (gameParameters: GameParametersType) => void;
}

export function ModalParameters({
  isVisible,
  onClose,
  startNewGame,
  gameParameters,
  onGameParametersChange,
}: ModalParametersProps) {
  const [activeTab, setActiveTab] = useState<'game' | 'settings'>('game');
  return (
    <ModalTabs
      isVisible={isVisible}
      tabs={[
        { name: 'game', text: i18n.t('game') },
        { name: 'settings', text: i18n.t('settings') },
      ]}
      value={activeTab}
      onChange={(value) => setActiveTab(value)}
      onClose={onClose}
    >
      {activeTab === 'game' ? (
        <>
          <Parameters
            value={gameParameters}
            onChange={onGameParametersChange}
          />
          <View style={styles.container}>
            <TouchableOpacity onPress={startNewGame} style={styles.button}>
              <Text style={styles.buttonText} onPress={() => startNewGame()}>
                {i18n.t('startNewGame')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text>Content for Tab 2</Text>
      )}
    </ModalTabs>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
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
