import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { GameCard, GameCardAnimated } from '../types/gameCard';
import { Card } from '../components/card';
import { getDeck } from '@shared';
import { displayCardsAnimation, getCardDimensions } from '../utils/card';
import { useWindowSize } from '../hook/useWindowSize';

export interface RemainingCardsHandle {
  getPosition: () => Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface RemainingCardsProps {
  playedCards: GameCard[];
}

export const RemainingCards = forwardRef(
  ({ playedCards }: RemainingCardsProps, ref) => {
    const windowSize = useWindowSize();
    const containerRef = useRef<View | null>(null);

    const cardAnimations = useRef<Map<string, GameCardAnimated>>(new Map());
    const [disappearingCards, setDisappearingCards] = useState<Set<string>>(
      new Set()
    );
    const [containerWidth, setContainerWidth] = useState<number | null>(null);

    const remainingCards = useMemo(() => {
      return getDeck().filter(
        (card) =>
          !playedCards.find((c) => c.card.id === card.id) &&
          !disappearingCards.has(card.id as string)
      );
    }, [playedCards, disappearingCards]);

    useEffect(() => {
      getDeck().forEach((card) => {
        const cardId = card.id as string;
        if (!cardAnimations.current.has(cardId)) {
          cardAnimations.current.set(cardId, {
            initialTranslateX: 0,
            initialTranslateY: 0,
            translateX: new Animated.Value(0),
            translateY: new Animated.Value(0),
            scale: new Animated.Value(1),
            opacity: new Animated.Value(1),
          });
        }
      });
    }, []);

    useEffect(() => {
      if (!containerWidth) return;
      Animated.parallel(
        displayCardsAnimation({
          cards: remainingCards.map(
            (card) =>
              cardAnimations.current.get(card.id as string) as GameCardAnimated
          ),
          windowSize,
          containerWidth: containerWidth,
        })
      ).start();
    }, [remainingCards, containerWidth, windowSize]);

    useImperativeHandle(
      ref,
      (): RemainingCardsHandle => ({
        getPosition: async () => {
          return new Promise((resolve) => {
            containerRef.current?.measureInWindow((x, y, width, height) => {
              resolve({ x, y, width, height });
            });
          });
        },
      })
    );

    const handleCardPlayed = (cardId: string) => {
      setDisappearingCards((prev) => new Set(prev).add(cardId));
      const cardAnimation = cardAnimations.current.get(cardId);

      if (cardAnimation?.opacity) {
        Animated.parallel([
          Animated.timing(cardAnimation.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cardAnimation.scale, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDisappearingCards((prev) => {
            const next = new Set(prev);
            next.delete(cardId);
            return next;
          });
        });
      }
    };

    useEffect(() => {
      playedCards.forEach((playedCard) => {
        const cardId = playedCard.card.id as string;
        if (!disappearingCards.has(cardId)) {
          handleCardPlayed(cardId);
        }
      });
    }, [playedCards, disappearingCards]);

    const getStyle = (cardId: string) => {
      const card = cardAnimations.current.get(cardId);
      if (!card) return;
      return {
        transform: [
          { translateX: card.translateX },
          { translateY: card.translateY },
          { scale: card.scale },
        ],
        opacity: card.opacity,
      };
    };

    return (
      <View
        ref={containerRef}
        style={[
          styles.container,
          { height: windowSize.large ? 300 : windowSize.medium ? 150 : 110 },
        ]}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setContainerWidth(width);
        }}
      >
        {remainingCards.map((card) => (
          <Animated.View
            key={card.id}
            style={[
              styles.card,
              getCardDimensions(
                windowSize.large ? 80 : windowSize.medium ? 40 : 30
              ),
              getStyle(card.id as string),
            ]}
          >
            <Card card={card} flipped={true} />
            <View
              style={[
                styles.overlay,
                {
                  borderRadius: windowSize.large
                    ? 10
                    : windowSize.medium
                    ? 4
                    : 2,
                },
              ]}
            ></View>
          </Animated.View>
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginVertical: 10,
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  card: {
    position: 'absolute',
  },
});
