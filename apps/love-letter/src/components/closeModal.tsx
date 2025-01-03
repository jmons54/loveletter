import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import React from 'react';
import { playSound } from '../utils/sound';

export function CloseModal({ onPress, ...props }: PressableProps) {
  return (
    <Pressable
      style={[styles.closeIcon]}
      onPress={(e) => {
        if (onPress) {
          playSound('click');
          onPress(e);
        }
      }}
    >
      <Icon name="close" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 8,
  },
});
