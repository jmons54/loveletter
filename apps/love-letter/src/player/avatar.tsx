import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated } from 'react-native';
import { primaryColor, secondaryColor } from '../utils/color';
import { useWindowSize } from '../hook/useWindowSize';

export interface AvatarProps {
  avatarRef?: React.MutableRefObject<Image | null>;
  name: string;
  avatar: ImageData;
  isActive?: boolean;
  style?: object;
}

export function Avatar({
  avatarRef,
  name,
  avatar,
  isActive = false,
  style,
}: AvatarProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const shadowOpacity = useRef(new Animated.Value(0)).current;

  const windowSize = useWindowSize();
  const avatarSize = windowSize.large ? 80 : windowSize.medium ? 60 : 50;

  useEffect(() => {
    if (isActive) {
      Animated.timing(scale, {
        toValue: 1.25,
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
  }, [isActive, scale, shadowOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          transform: [{ scale }],
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: shadowOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
          }),
          shadowRadius: 10,
        }}
      >
        <Image
          ref={avatarRef}
          source={avatar}
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              top: windowSize.large ? 20 : windowSize.medium ? 15 : 12,
            },
            style,
          ]}
          accessibilityLabel={`Avatar`}
        />
      </Animated.View>
      <View
        style={[
          styles.nameContainer,
          { width: windowSize.large ? 120 : windowSize.medium ? 90 : 80 },
        ]}
      >
        <Text
          style={[
            styles.nameText,
            { fontSize: windowSize.large ? 20 : windowSize.medium ? 14 : 12 },
          ]}
        >
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    resizeMode: 'cover',
  },
  nameContainer: {
    position: 'relative',
    backgroundColor: secondaryColor,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    textAlign: 'center',
    alignItems: 'center',
  },
  nameText: {
    color: primaryColor,
    textAlign: 'center',
    fontFamily: 'AmaticSC',
  },
});
