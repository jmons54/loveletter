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
import { NextActionType } from './gameView';

export interface GameCardsHandle {
  shuffleCards: (params: { cards: CardType[]; onComplete: () => void }) => void;
  distributeAsideCard: (onComplete: () => void) => void;
  distributeCardToPlayer: (params: {
    player: PlayerEntity;
    toX: number;
    toY: number;
    delay?: number;
    cardId: string | null;
    onComplete: () => void;
  }) => void;
  sendCardToPlayed: (params: {
    cardId: string;
    x: number;
    y: number;
    width: number;
  }) => Promise<void>;
  botPlayCard: (cardId: string) => Promise<void>;
  showCard: (cardIndex: string) => Promise<void>;
  hideCard: (cardIndex: string) => Promise<void>;
  swapCards: (
    player1: {
      player: PlayerEntity;
      cardId: string;
      toX: number;
      toY: number;
      isUser: boolean;
      currentCardId: string | null;
    },
    player2: {
      player: PlayerEntity;
      cardId: string;
      toX: number;
      toY: number;
    }
  ) => Promise<void>;
}

interface GameCardsProps {
  user: UserType;
  isPlayerTurn: boolean;
  playedCards: GameCard[];
  setPlayedCards: React.Dispatch<React.SetStateAction<GameCard[]>>;
  nextAction: NextActionType;
  setNextAction: React.Dispatch<React.SetStateAction<NextActionType>>;
  onPlayCard: (id: string) => void;
  onChancellorEffect: (cardId: string) => void;
  currentCardId: string | null;
}

export const GameCards = forwardRef(
  (
    {
      user,
      isPlayerTurn,
      nextAction,
      setNextAction,
      playedCards,
      setPlayedCards,
      onPlayCard,
      onChancellorEffect,
      currentCardId,
    }: GameCardsProps,
    ref
  ) => {
    const windowSize = useWindowSize();

    const [isShuffling, setIsShuffling] = useState(false);
    const [gameCards, setGameCards] = useState<GameCard[]>([]);

    const gameCardContainerRef = useRef<View | null>(null);
    const shuffleCompleteRef = useRef<(() => void) | null>(null);

    const initCards = useShuffleCards(gameCards, isShuffling, () => {
      setIsShuffling(false);
      shuffleCompleteRef.current?.();
    });

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

      Animated.parallel([
        Animated.timing(gameCard.translateX, {
          toValue: windowSize.large ? 50 : windowSize.medium ? 35 : 25,
          duration: 500,
          useNativeDriver: true,
        }),
        ...offsetUndistributedCards(updatedCards, windowSize),
      ]).start(onComplete);
    };

    const swapCards: GameCardsHandle['swapCards'] = (player1, player2) => {
      const updatedCards = [...gameCards];
      const card1 = updatedCards.find(
        ({ card }) => card.id === player1.cardId
      ) as GameCard;
      const card2 = updatedCards.find(
        ({ card }) => card.id === player2.cardId
      ) as GameCard;

      card1.player = player1.player;
      card2.player = player2.player;
      card1.flipped = player1.isUser;
      card2.flipped = false;

      const tempY = card1.initialTranslateY;
      card1.initialTranslateY = card2.initialTranslateY;
      card2.initialTranslateY = tempY;

      const tempX = card1.initialTranslateX;
      card1.initialTranslateX = card2.initialTranslateX;
      card2.initialTranslateX = tempX;

      playSound('cardMove');

      const player1Cards = updatedCards.filter(
        (card) =>
          card.player?.id === player1.player.id &&
          card.isDistributed &&
          card.card.id !== player1.currentCardId
      );
      const player2Cards = updatedCards.filter(
        (card) => card.player?.id === player2.player.id && card.isDistributed
      );

      const animations: Animated.CompositeAnimation[] = [
        ...animatePlayerCards(
          player1Cards,
          player1.isUser,
          windowSize,
          player1.toX
        ),
        ...animatePlayerCards(player2Cards, false, windowSize, player2.toX),
        Animated.timing(card1.translateY, {
          toValue:
            player1.toY -
            (windowSize.large
              ? player1.isUser
                ? 70
                : 47.5
              : windowSize.medium
              ? player1.isUser
                ? 62.5
                : 45
              : player1.isUser
              ? 45
              : 35),
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(card2.translateY, {
          toValue:
            player2.toY -
            (windowSize.large ? 47.5 : windowSize.medium ? 45 : 35),
          duration: 500,
          useNativeDriver: true,
        }),
      ];

      if (player1.isUser) {
        animations.push(
          Animated.timing(card1.scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        );
        animations.push(
          Animated.timing(card2.scale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          })
        );
      }

      return new Promise((resolve) => {
        Animated.delay(500).start(() => {
          setGameCards(updatedCards);
          Animated.parallel(animations).start(() => {
            resolve();
          });
        });
      });
    };

    const distributeCardToPlayer: GameCardsHandle['distributeCardToPlayer'] = ({
      player,
      toX,
      toY,
      delay = 0,
      cardId,
      onComplete,
    }) => {
      const cardIndex = gameCards.findIndex((card) => !card.isDistributed);
      if (cardIndex === -1) return;

      const isUser = player.id === user.id;

      const zIndex =
        gameCards.find(
          (card) =>
            cardId === card.card.id ||
            (!cardId && card.player?.id === player.id)
        )?.zIndex ?? 100;

      const updatedCards = [...gameCards];
      updatedCards[cardIndex].isDistributed = true;
      updatedCards[cardIndex].player = player;
      updatedCards[cardIndex].zIndex = zIndex + 1;
      updatedCards[cardIndex].flipped = isUser;
      updatedCards[cardIndex].initialTranslateX = toX;
      updatedCards[cardIndex].initialTranslateY = toY;

      Animated.delay(delay).start(() => {
        playSound(isUser ? 'cardFlip' : 'cardMove');
        setGameCards(updatedCards);
        const gameCard = updatedCards[cardIndex];
        const playerCards = updatedCards.filter(
          (card) =>
            card.player?.id === player.id &&
            card.isDistributed &&
            card.card.id !== cardId
        );

        const animations = [
          ...animatePlayerCards(playerCards, isUser, windowSize, toX),
          ...offsetUndistributedCards(updatedCards, windowSize),
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
          }),
        ];

        if (isUser) {
          animations.push(
            Animated.timing(gameCard.scale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            })
          );
        }

        Animated.parallel(animations).start(() => {
          onComplete();
        });
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

    const sendCardToDeck = ({
      cardIndex,
      isUser = false,
      onComplete,
    }: {
      cardIndex: number;
      isUser?: boolean;
      onComplete: (gameCards: GameCard[]) => void;
    }) => {
      const updatedCards = [...gameCards];
      const gameCard = updatedCards[cardIndex];
      gameCard.isDistributed = false;
      gameCard.flipped = false;

      updatedCards.splice(cardIndex, 1);
      updatedCards.push(gameCard);

      updatedCards.forEach((card, index) => {
        if (card.player && card.card.id !== gameCard.card.id) return;
        card.zIndex = updatedCards.length - index;
      });

      const playerCards = updatedCards.filter(
        (card) =>
          card.card.id !== currentCardId &&
          card.player?.id === gameCard.player?.id &&
          card.card.id !== gameCard.card.id
      );

      setGameCards(updatedCards);

      const animations = [
        Animated.timing(gameCard.translateX, {
          toValue: windowSize.large ? -60 : windowSize.medium ? -35 : -25,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(gameCard.translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        ...animatePlayerCards(playerCards, isUser, windowSize),
      ];

      if (isUser) {
        animations.push(
          Animated.timing(gameCard.scale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          })
        );
      }

      Animated.parallel(animations).start(() => {
        Animated.parallel(
          offsetUndistributedCards(updatedCards, windowSize)
        ).start();
        gameCard.initialTranslateY = 0;
        gameCard.initialTranslateX = 0;
        gameCard.player = null;
        setGameCards(updatedCards);
        onComplete(updatedCards);
      });
    };

    const sendPlayedCard = ({
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
      gameCard.zIndex = 150;
      gameCard.flipped = true;
      setGameCards(updatedCards);

      const playerCards = updatedCards.filter(
        (card) =>
          card.player?.id === gameCard.player?.id &&
          card.card.id !== gameCard.card.id
      );

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
        ...animatePlayerCards(playerCards, isUser, windowSize),
      ];

      if (isUser) {
        animations.push(
          Animated.timing(gameCard.scale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          })
        );
      }

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

    const showCard: GameCardsHandle['showCard'] = (cardId) => {
      const updatedCards = [...gameCards];
      const gameCard = updatedCards.find(
        (c) => c.card.id === cardId
      ) as GameCard;
      gameCard.flipped = true;
      setGameCards(updatedCards);
      return new Promise<void>((resolve) => {
        Animated.delay(2000).start(() => {
          resolve();
        });
      });
    };

    const hideCard: GameCardsHandle['hideCard'] = (cardId) => {
      const updatedCards = [...gameCards];
      const gameCard = updatedCards.find(
        (c) => c.card.id === cardId
      ) as GameCard;
      gameCard.flipped = false;
      setGameCards(updatedCards);
      return new Promise<void>((resolve) => {
        Animated.delay(1000).start(() => {
          resolve();
        });
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
          playedCard.zIndex =
            300 + deckOrder.findIndex((card) => card.id === playedCard.card.id);
          playedCard.player = null;
          setGameCards(updatedCards);
          playSound('cardMove');

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

            Animated.parallel([
              Animated.timing(playedCard.scale, {
                toValue: windowSize.large ? 0.8 : 0.5,
                duration: 500,
                useNativeDriver: true,
              }),
              ...displayCardsAnimation({
                cards: updatedPlayedCards,
                windowSize,
                containerWidth: width,
                diffY,
                diffX,
              }),
            ]).start(() => {
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
        sendPlayedCard({
          cardIndex,
          isUser: false,
          onComplete() {
            resolve();
          },
        });
      });
    };

    const handlePlayCard = (gameCard: GameCard, index: number) => {
      if (gameCard.player?.id !== user.id || !isPlayerTurn) return;
      if (nextAction === 'playCard') {
        playSound('cardPlay');
        setNextAction(null);
        sendPlayedCard({
          cardIndex: index,
          isUser: true,
          onComplete() {
            onPlayCard(gameCards[index].card.id as string);
          },
        });
      } else if (nextAction === 'playChancellorEffect') {
        playSound('cardMove');
        setNextAction(null);
        sendCardToDeck({
          cardIndex: index,
          isUser: true,
          onComplete(gameCards) {
            const playerCards = gameCards.filter(
              ({ player }) => player?.id === user.id
            );
            if (playerCards.length === 2) {
              const cardId = gameCards.find(
                (gameCard) =>
                  gameCard.player?.id === user.id &&
                  gameCard.card.id !== currentCardId
              )?.card.id;
              onChancellorEffect(cardId as string);
            } else {
              setNextAction('playChancellorEffect');
            }
          },
        });
      }
    };

    useImperativeHandle(
      ref,
      (): GameCardsHandle => ({
        shuffleCards,
        distributeCardToPlayer,
        distributeAsideCard,
        sendCardToPlayed,
        botPlayCard,
        showCard,
        hideCard,
        swapCards,
      })
    );

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
