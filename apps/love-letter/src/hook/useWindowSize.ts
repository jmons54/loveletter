import { useWindowDimensions } from 'react-native';

export interface WindowSize {
  large: boolean;
  medium: boolean;
  small: boolean;
}

export function useWindowSize(): WindowSize {
  const { width, height } = useWindowDimensions();

  return {
    large: width > 768,
    medium: height >= 600,
    small: height < 600,
  };
}
