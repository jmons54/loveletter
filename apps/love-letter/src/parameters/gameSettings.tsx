import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { activeColor } from '../utils/color';
import i18n from '@i18n';

interface SettingsProps {
  isAutoPlay: boolean;
  isSoundEnabled: boolean;
  isMusicEnabled: boolean;
  toggleAutoplay: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
}

export const GameSettings = ({
  isAutoPlay,
  isSoundEnabled,
  isMusicEnabled,
  toggleAutoplay,
  toggleSound,
  toggleMusic,
}: SettingsProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.setting}>
        <Text style={styles.title}>{i18n.t('autoPlay')}</Text>
        <Switch
          value={isAutoPlay}
          onValueChange={toggleAutoplay}
          trackColor={{ false: '#ccc', true: activeColor }}
          thumbColor={isAutoPlay ? activeColor : '#f4f3f4'}
        />
      </View>
      <View style={styles.setting}>
        <Text style={styles.title}>{i18n.t('soundsEffects')}</Text>
        <Switch
          value={isSoundEnabled}
          onValueChange={toggleSound}
          trackColor={{ false: '#ccc', true: activeColor }}
          thumbColor={isSoundEnabled ? activeColor : '#f4f3f4'}
        />
      </View>
      <View style={styles.setting}>
        <Text style={styles.title}>{i18n.t('music')}</Text>
        <Switch
          value={isMusicEnabled}
          onValueChange={toggleMusic}
          trackColor={{ false: '#ccc', true: activeColor }}
          thumbColor={isMusicEnabled ? activeColor : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 40,
    padding: 16,
  },
  setting: {
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontFamily: 'AmaticSC',
    marginBottom: 8,
    textAlign: 'center',
    color: '#fff',
  },
});
