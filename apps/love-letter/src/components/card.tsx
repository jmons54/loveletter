import React, { useEffect, useState } from 'react';
import type { CardType } from '@shared';
import {
  Animated,
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import backCardImage from '../../assets/cards/back.png';
import { getCardImage } from '../utils/cardImage';

interface CardProps {
  card?: CardType | null;
  flipped?: boolean;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Card = ({
  card,
  flipped = false,
  animate = false,
  style,
}: CardProps) => {
  const [flipAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: flipped ? 1 : 0,
      duration: animate ? 500 : 0,
      useNativeDriver: true,
    }).start();
  }, [flipped, animate, flipAnim]);

  const interpolateFrontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const interpolateBackRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: interpolateFrontRotation }],
    zIndex: flipAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    }),
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: interpolateBackRotation }],
    zIndex: flipAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1, 0],
    }),
  };

  return (
    <View style={[styles.cardContainer, style]}>
      <Animated.View style={[styles.card, backAnimatedStyle]}>
        <Image source={backCardImage} style={styles.cardImage} />
      </Animated.View>
      {card && (
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          <Image
            source={getCardImage(card.value)}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: '100%',
    maxWidth: 100,
    maxHeight: 175,
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    elevation: 50,
  },
});
