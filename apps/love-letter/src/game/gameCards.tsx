import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
} from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import type { CardType } from '@shared';
import type { UserType } from '../types/userType';
import type { GameCard } from '../types/gameCard';
import { playSound } from '../utils/sound';
import { getDeck } from '@shared';
import { PlayerEntity } from '@offline';
import {
  animatePlayerCards,
  displayCardsAnimation,
  getCardDimensions,
  getCardDimensionsFromWindowSize,
  offsetUndistributedCards,
} from '../utils/card';
import { AnimatedCard } from '../components/animatedCard';
import { useWindowSize } from '../hook/useWindowSize';
import { useShuffleCards } from '../hook/useShuffleCards';

export interface GameCardsHandle {
  shuffleCards: (params: { cards: CardType[]; onComplete: () => void }) => void;
  distributeAsideCard: (onComplete: () => void) => void;
  distributeCardToPlayer: (params: {
    player: PlayerEntity;
    toX: number;
    toY: number;
    delay?: number;
    onComplete: () => void;
  }) => void;
  sendCardToPlayed: (params: {
    cardId: string;
    x: number;
    y: number;
    width: number;
  }) => Promise<void>;
  botPlayCard: (cardId: string) => Promise<void>;
}

interface GameCardsProps {
  user: UserType;
  isPlayerTurn: boolean;
  isGamePaused: boolean;
  playedCards: GameCard[];
  setPlayedCards: React.Dispatch<React.SetStateAction<GameCard[]>>;
  nextAction: 'playBot' | 'playCard' | null;
  setNextAction: React.Dispatch<
    React.SetStateAction<'playBot' | 'playCard' | null>
  >;
  onPlayCard: (id: string) => void;
}

export const GameCards = forwardRef(
  (
    {
      user,
      isPlayerTurn,
      isGamePaused,
      nextAction,
      setNextAction,
      playedCards,
      setPlayedCards,
      onPlayCard,
    }: GameCardsProps,
    ref
  ) => {
    const windowSize = useWindowSize();

    const [isShuffling, setIsShuffling] = useState(false);
    const [gameCards, setGameCards] = useState<GameCard[]>([]);

    const gameCardContainerRef = useRef<View | null>(null);
    const shuffleCompleteRef = useRef<(() => void) | null>(null);

    const initCards = useShuffleCards(
      gameCards,
      isShuffling,
      isGamePaused,
      () => {
        setIsShuffling(false);
        shuffleCompleteRef.current?.();
      }
    );

    const distributeAsideCard: GameCardsHandle['distributeAsideCard'] = (
      onComplete
    ) => {
      const cardIndex = gameCards.findIndex((card) => !card.isDistributed);
      if (cardIndex === -1) return;

      const updatedCards = [...gameCards];
      const gameCard = updatedCards[cardIndex];
      gameCard.zIndex = 1;
      gameCard.isDistributed = true;
      gameCard.isAsideCard = true;
      setGameCards(updatedCards);

      Animated.timing(gameCard.translateX, {
        toValue: windowSize.large ? 50 : windowSize.medium ? 35 : 25,
        duration: 500,
        useNativeDriver: true,
      }).start(onComplete);

      offsetUndistributedCards(updatedCards, windowSize);
    };

    const distributeCardToPlayer: GameCardsHandle['distributeCardToPlayer'] = ({
      player,
      toX,
      toY,
      delay = 0,
      onComplete,
    }) => {
      const cardIndex = gameCards.findIndex((card) => !card.isDistributed);
      if (cardIndex === -1) return;

      const isUser = player.id === user.id;

      const zIndex =
        gameCards.find((card) => card.player?.id === player.id)?.zIndex ?? 100;

      const updatedCards = [...gameCards];
      const gameCard = updatedCards[cardIndex];
      gameCard.isDistributed = true;
      gameCard.player = player;
      gameCard.zIndex = zIndex + 1;
      gameCard.flipped = isUser;
      gameCard.initialTranslateX = toX;
      gameCard.initialTranslateY = toY;

      Animated.delay(delay).start(() => {
        playSound(isUser ? 'cardFlip' : 'cardMove');
        setGameCards(updatedCards);
        const playerCards = updatedCards.filter(
          (card) => card.player?.id === player.id && card.isDistributed
        );
        animatePlayerCards(playerCards, isUser, windowSize, toX);

        if (isUser) {
          Animated.timing(gameCard.scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          gameCard.flipped = true;
        }

        Animated.timing(gameCard.translateY, {
          toValue:
            toY -
            (windowSize.large
              ? isUser
                ? 70
                : 47.5
              : windowSize.medium
              ? isUser
                ? 62.5
                : 45
              : isUser
              ? 45
              : 35),
          duration: 500,
          delay: isUser ? 500 : 0,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
        });
        offsetUndistributedCards(updatedCards, windowSize);
      });
    };

    const shuffleCards: GameCardsHandle['shuffleCards'] = ({
      cards,
      onComplete,
    }) => {
      setGameCards(initCards(cards, windowSize));
      shuffleCompleteRef.current = onComplete;
      setIsShuffling(true);
    };

    const returnCardToDeck = ({
      cardIndex,
      isUser = false,
      onComplete,
    }: {
      cardIndex: number;
      isUser?: boolean;
      onComplete: () => void;
    }) => {
      const updatedCards = [...gameCards];
      const gameCard = updatedCards[cardIndex];
      updatedCards[cardIndex].zIndex = 210;
      updatedCards[cardIndex].flipped = true;
      setGameCards(updatedCards);

      const playerCards = updatedCards.filter(
        (card) =>
          card.player?.id === gameCard.player?.id &&
          card.card.id !== gameCard.card.id
      );

      animatePlayerCards(playerCards, isUser, windowSize);

      if (isUser) {
        Animated.timing(gameCard.scale, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }

      const animations = [
        Animated.timing(gameCard.translateX, {
          toValue: windowSize.large ? 50 : windowSize.medium ? 35 : 25,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(gameCard.translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ];

      Animated.parallel(animations).start(() => {
        if (!isUser) {
          Animated.timing(gameCard.scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(gameCard.scale, {
              toValue: 0.8,
              duration: 500,
              useNativeDriver: true,
            }).start(onComplete);
          });
        } else {
          onComplete();
        }
      });
    };

    const sendCardToPlayed: GameCardsHandle['sendCardToPlayed'] = ({
      cardId,
      x,
      y,
      width,
    }) => {
      const updatedCards = [...gameCards];
      const playedCard = updatedCards.find(
        (c) => c.card.id === cardId
      ) as GameCard;
      const deckOrder = getDeck();
      const updatedPlayedCards = [...playedCards, playedCard];
      updatedPlayedCards.sort((a, b) => {
        const indexA = deckOrder.findIndex((card) => card.id === a.card.id);
        const indexB = deckOrder.findIndex((card) => card.id === b.card.id);
        return indexA - indexB;
      });

      return new Promise<void>((resolve) => {
        Animated.delay(500).start(() => {
          playSound('cardMove');
          playedCard.zIndex =
            101 + deckOrder.findIndex((card) => card.id === playedCard.card.id);
          playedCard.player = null;
          setGameCards(updatedCards);

          if (!windowSize.large) {
            Animated.timing(playedCard.scale, {
              toValue: 0.5,
              duration: 500,
              useNativeDriver: true,
            }).start();
          }

          setPlayedCards(updatedPlayedCards);
          const cardDimensions = getCardDimensions(
            windowSize.large ? 80 : windowSize.medium ? 40 : 30
          );
          gameCardContainerRef.current?.measureInWindow(async (dx, dy) => {
            const diffX = x - dx + cardDimensions.width / 2;
            const diffY =
              y -
              dy +
              cardDimensions.height / 2 +
              (windowSize.large ? 150 : windowSize.medium ? 80 : 60);

            Animated.parallel(
              displayCardsAnimation({
                cards: updatedPlayedCards,
                windowSize,
                containerWidth: width,
                diffY,
                diffX,
              })
            ).start(() => {
              resolve();
            });
          });
        });
      });
    };

    const botPlayCard: GameCardsHandle['botPlayCard'] = (cardId) => {
      setNextAction(null);
      const cardIndex = gameCards.findIndex((card) => card.card.id === cardId);
      playSound('cardFlip');
      return new Promise<void>((resolve) => {
        returnCardToDeck({
          cardIndex,
          isUser: false,
          onComplete() {
            resolve();
          },
        });
      });
    };

    useImperativeHandle(
      ref,
      (): GameCardsHandle => ({
        shuffleCards,
        distributeCardToPlayer,
        distributeAsideCard,
        sendCardToPlayed,
        botPlayCard,
      })
    );

    const handlePlayCard = (gameCard: GameCard, index: number) => {
      if (
        gameCard.player?.id === user.id &&
        isPlayerTurn &&
        nextAction === 'playCard'
      ) {
        playSound('cardPlay');
        setNextAction(null);
        returnCardToDeck({
          cardIndex: index,
          isUser: true,
          onComplete() {
            onPlayCard(gameCards[index].card.id as string);
          },
        });
      }
    };

    const dimensions = getCardDimensionsFromWindowSize(windowSize);

    return (
      <View ref={gameCardContainerRef} style={styles.container}>
        {gameCards.map((gameCard, index) => (
          <AnimatedCard
            key={gameCard.card.id}
            dimensions={dimensions}
            card={gameCard}
            onPress={() => handlePlayCard(gameCard, index)}
          />
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
