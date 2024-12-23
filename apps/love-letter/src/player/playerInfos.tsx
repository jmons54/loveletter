import React, { useEffect, useMemo, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { PlayerEntity } from '@offline';
import { TouchableAvatar } from './touchableAvatar';
import { primaryColor, secondaryColor } from '../utils/color';
import { playSound } from '../utils/sound';
import spy from '../../assets/spy.png';
import handmaid from '../../assets/handmaid.png';
import { useWindowSize } from '../hook/useWindowSize';
import { getAvatar } from '../utils/avatar';

interface PlayerInfosProps {
  player: PlayerEntity;
  hasSpy: boolean;
  onTarget?: (playerId: number) => void;
  isTargetedChoice?: boolean;
  isActive: boolean;
  isHighlighted: boolean;
  isTargeted: boolean;
}

export function PlayerInfos({
  player,
  hasSpy,
  onTarget,
  isTargetedChoice,
  isActive,
  isHighlighted,
  isTargeted,
}: PlayerInfosProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0)).current;

  const animated = useMemo(
    () => isActive || isTargeted || isHighlighted,
    [isActive, isTargeted, isHighlighted]
  );

  useEffect(() => {
    if (animated) {
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(shadowOpacity, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(shadowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [animated, scale, shadowOpacity]);

  const color =
    isTargeted || isTargetedChoice
      ? '#E57373'
      : isActive
      ? primaryColor
      : secondaryColor;

  const props = {
    name: player.name,
    avatar: getAvatar(player.avatar as number),
    isTargetedChoice,
    isActive: animated,
    style: {
      shadowColor: color,
      borderColor: color,
    },
  };

  const windowSize = useWindowSize();
  const iconSize = windowSize.large ? 60 : windowSize.medium ? 40 : 30;

  return (
    <View
      style={[styles.container, { opacity: player.isEliminated ? 0.7 : 1 }]}
    >
      <TouchableAvatar
        {...props}
        onClick={() => {
          if (isTargetedChoice) {
            playSound('click');
            onTarget?.(player.id);
          }
        }}
      />

      {hasSpy && !player.isEliminated && (
        <View
          style={[
            styles.iconContainer,
            {
              left: windowSize.large ? 75 : windowSize.medium ? 60 : 50,
              top: windowSize.large ? 40 : windowSize.medium ? 30 : 25,
            },
          ]}
        >
          <Image
            source={spy}
            style={[
              { width: iconSize, height: iconSize, borderRadius: iconSize / 2 },
            ]}
          />
        </View>
      )}

      {player.isProtected && (
        <View
          style={[
            styles.iconContainer,
            {
              right: windowSize.large ? 75 : windowSize.medium ? 60 : 50,
              top: windowSize.large ? 40 : windowSize.medium ? 30 : 25,
            },
          ]}
        >
          <Image
            source={handmaid}
            style={[
              { width: iconSize, height: iconSize, borderRadius: iconSize / 2 },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  iconContainer: {
    position: 'absolute',
    zIndex: -1,
  },
});
