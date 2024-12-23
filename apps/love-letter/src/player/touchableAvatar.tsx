import React from 'react';
import { Pressable } from 'react-native';
import { Avatar, AvatarProps } from './avatar';

interface TouchableAvatarProps extends AvatarProps {
  onClick?: () => void;
}

export function TouchableAvatar({ onClick, ...props }: TouchableAvatarProps) {
  return (
    <Pressable onPress={onClick}>
      <Avatar {...props} />
    </Pressable>
  );
}
