import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import type { GameCard } from '../types/gameCard';
import { Card } from './card';

interface AnimatedCardProps {
  card: GameCard;
  onPress: () => void;
  dimensions: { width: number; height: number };
}

export const AnimatedCard = ({
  card,
  onPress,
  dimensions,
}: AnimatedCardProps) => {
  const { translateX, translateY, scale, zIndex, flipped } = card;

  return (
    <Animated.View
      style={[
        styles.card,
        dimensions,
        {
          transform: [{ translateX }, { translateY }, { scale }],
        },
        { zIndex },
      ]}
    >
      <Pressable onPress={onPress} style={StyleSheet.absoluteFillObject}>
        <Card card={card.card} flipped={flipped} animate={true} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
