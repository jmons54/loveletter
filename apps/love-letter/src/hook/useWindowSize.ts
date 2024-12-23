import { useWindowDimensions } from 'react-native';

export interface WindowSize {
  large: boolean;
  medium: boolean;
  small: boolean;
}

export function useWindowSize(): WindowSize {
  const { width, height } = useWindowDimensions();
  const windowSize: WindowSize = {
    large: false,
    medium: false,
    small: false,
  };
  if (width > 768) {
    windowSize.large = true;
  } else if (height >= 600) {
    windowSize.medium = true;
  } else {
    windowSize.small = true;
  }
  return windowSize;
}
