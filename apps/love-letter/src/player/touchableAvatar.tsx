import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Avatar, AvatarProps } from './avatar';

interface TouchableAvatarProps extends AvatarProps {
  onClick?: () => void;
}

export function TouchableAvatar({ onClick, ...props }: TouchableAvatarProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onClick}>
      <Avatar {...props} />
    </TouchableOpacity>
  );
}
