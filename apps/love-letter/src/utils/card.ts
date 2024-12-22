import type { GameCard, GameCardAnimated } from '../types/gameCard';
import { Animated } from 'react-native';
import { WindowSize } from '../hook/useWindowSize';

export function getCardDimensions(width: number) {
  return {
    width,
    height: width * 1.75,
  };
}

export function getCardDimensionsFromWindowSize(windowSize: WindowSize) {
  return getCardDimensions(
    windowSize.large ? 100 : windowSize.medium ? 80 : 60
  );
}

export function displayCardsAnimation({
  cards,
  diffX = 0,
  diffY = 0,
  containerWidth,
  windowSize,
}: {
  cards: GameCardAnimated[];
  windowSize: WindowSize;
  diffX?: number;
  diffY?: number;
  containerWidth: number;
}) {
  const horizontalSpacing =
    (containerWidth - (windowSize.large ? 60 : windowSize.medium ? 45 : 30)) /
    21;
  const cardsPerRow = 21;

  return cards.flatMap((card, index) => {
    const column = index % cardsPerRow;

    const valueX = diffX + (column * horizontalSpacing + 10);
    const valueY = diffY;

    const response = [];
    if (valueX !== card.lastTranslateX) {
      response.push(
        Animated.timing(card.translateX, {
          toValue: valueX,
          duration: 500,
          useNativeDriver: true,
        })
      );
    }
    if (valueY !== card.lastTranslateY) {
      response.push(
        Animated.timing(card.translateY, {
          toValue: valueY,
          duration: 500,
          useNativeDriver: true,
        })
      );
    }

    card.lastTranslateX = valueX;
    card.lastTranslateY = valueY;

    return response;
  });
}

export const animateCards = (
  cards: GameCard[],
  animations: (card: GameCard) => Animated.CompositeAnimation,
  stagger: number,
  onComplete?: () => void
) => {
  const animatedSequences = cards.map(animations);
  Animated.stagger(stagger, animatedSequences).start(() => {
    onComplete?.();
  });
};

export const offsetUndistributedCards = (
  deckCards: GameCard[],
  windowSize: WindowSize
) => {
  const undistributedCards = deckCards.filter((card) => !card.isDistributed);
  const baseOffset = windowSize.large ? -60 : windowSize.medium ? -35 : -25;
  undistributedCards.forEach((card, index) => {
    Animated.timing(card.translateX, {
      toValue:
        baseOffset -
        index * (windowSize.large ? 1.5 : windowSize.medium ? 1 : 0.75),
      duration: 500,
      useNativeDriver: true,
    }).start();
  });
};

export const animatePlayerCards = (
  playerCards: GameCard[],
  isUser: boolean,
  windowSize: WindowSize,
  toX?: number
) => {
  const cardCount = playerCards.length;
  const offset = isUser
    ? windowSize.large
      ? 60
      : windowSize.medium
      ? 40
      : 30
    : windowSize.large
    ? 40
    : windowSize.medium
    ? 30
    : 25;
  const startOffset = -(offset * (cardCount - 1)) / 2;

  playerCards.forEach((card, index) => {
    Animated.timing(card.translateX, {
      toValue: (toX ?? card.initialTranslateX) + startOffset + index * offset,
      duration: 500,
      useNativeDriver: true,
    }).start();
  });
};
