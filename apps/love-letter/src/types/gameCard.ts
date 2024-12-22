import { CardType } from '@shared';
import { Animated } from 'react-native';
import { PlayerEntity } from '@offline';

export interface GameCard extends GameCardAnimated {
  card: CardType;
  isDistributed: boolean;
  isAsideCard?: boolean;
  player?: PlayerEntity | null;
  zIndex?: number;
  flipped?: boolean;
}

export interface GameCardAnimated {
  initialTranslateX: number;
  initialTranslateY: number;
  lastTranslateX?: number;
  lastTranslateY?: number;
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity?: Animated.Value;
}
