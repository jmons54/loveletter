import { useEffect } from 'react';
import { Animated } from 'react-native';
import type { CardType } from '@shared';
import type { GameCard } from '../types/gameCard';
import { playSound, stopSound } from '../utils/sound';
import { animateCards, getCardDimensionsFromWindowSize } from '../utils/card';
import { WindowSize } from './useWindowSize';

export function useShuffleCards(
  gameCards: GameCard[],
  isShuffling: boolean,
  onComplete: () => void
) {
  useEffect(() => {
    if (gameCards.length && isShuffling) {
      playSound('shuffle');

      animateCards(
        gameCards,
        (card) =>
          Animated.parallel([
            Animated.timing(card.translateX, {
              toValue: 25,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(card.translateY, {
              toValue: 25,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
        30,
        async () => {
          await stopSound('shuffle');
          await playSound('shuffle');

          animateCards(
            gameCards,
            (card) =>
              Animated.parallel([
                Animated.timing(card.translateX, {
                  toValue: 0,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(card.translateY, {
                  toValue: 0,
                  duration: 250,
                  useNativeDriver: true,
                }),
              ]),
            50,
            onComplete
          );
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShuffling, gameCards]);

  return (cards: CardType[], windowSize: WindowSize) => {
    return [...cards].reverse().map((card, index) => ({
      card,
      isDistributed: false,
      initialTranslateX: 0,
      initialTranslateY: 0,
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0.8),
      zIndex: cards.length - index,
      dimensions: {
        width: new Animated.Value(
          getCardDimensionsFromWindowSize(windowSize).width
        ),
        height: new Animated.Value(
          getCardDimensionsFromWindowSize(windowSize).height
        ),
      },
    }));
  };
}
