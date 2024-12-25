import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import type { UserType } from '../types/userType';
import type { GameCard } from '../types/gameCard';
import { PlayerInfos } from '../player/playerInfos';
import { GameEntity, GameService, PlayerEntity } from '@offline';
import { GameCards, GameCardsHandle } from './gameCards';
import {
  CardValue,
  CurrentEffectType,
  determineCardForBotPlayer,
  EffectResponse,
} from '@shared';
import { RemainingCards, RemainingCardsHandle } from './remainingCards';
import { useWindowSize } from '../hook/useWindowSize';
import { calculatePlayersPositions } from '../utils/position';
import { useInitGame } from '../hook/useInitGame';
import { pauseMusic, playMusic, resumeMusic, stopMusic } from '../utils/sound';
import { ModalGuard } from '../components/modalGuard';

export type NextActionType =
  | 'playBot'
  | 'playCard'
  | 'playChancellorEffect'
  | null;

interface GameViewProps {
  user: UserType;
  game: GameEntity;
  isGamePaused: boolean;
  setGame: Dispatch<SetStateAction<GameEntity | null>>;
}

export function GameView({ user, game, isGamePaused, setGame }: GameViewProps) {
  const windowSize = useWindowSize();

  const gameCardsRef = useRef<GameCardsHandle | null>(null);
  const remainingCardRef = useRef<RemainingCardsHandle | null>(null);
  const playerContainerRef = useRef<View | null>(null);

  const [playedCards, setPlayedCards] = useState<GameCard[]>([]);
  const [nextAction, setNextAction] = useState<NextActionType>(null);
  const [targetedPlayer, setTargetedPlayer] = useState<number | null>(null);
  const [targetedChoices, setTargetedChoices] = useState<number[] | null>(null);
  const [modalGuardIsVisible, setModalGuardIsVisible] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  const isGamePausedRef = useRef(isGamePaused);

  useEffect(() => {
    isGamePausedRef.current = isGamePaused;
  }, [isGamePaused]);

  const players = useMemo(() => game.players, [game.players]);
  const playersPositions = calculatePlayersPositions(players.length);

  const waitForResume = async (): Promise<void> => {
    while (isGamePausedRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  const { highlightedIndex } = useInitGame(
    game.status,
    players,
    isGamePaused,
    (turn: number) => {
      if (!isGamePaused) {
        GameService.initTurn(game, turn);
        setGame({ ...game });
        initRound(game);
      }
    }
  );

  const distributeCardToPlayer = useCallback(
    async (
      playerIndex: number,
      w: number,
      h: number,
      delay = 0,
      cardId: string | null = null
    ) => {
      await waitForResume();
      return new Promise<void>((resolve) => {
        const { top, left } = playersPositions[playerIndex];
        const toX = (left / 100) * w - w / 2;
        const toY = (top / 100) * h - h / 2;
        gameCardsRef.current?.distributeCardToPlayer({
          player: players[playerIndex],
          toX,
          toY,
          delay,
          cardId,
          onComplete() {
            resolve();
          },
        });
      });
    },
    [playersPositions, players]
  );

  const distributeCardToPlayerFromContainer = useCallback(
    async (playerIndex: number, delay = 0, cardId: string | null = null) => {
      const { w, h } = await getPlayerContainerSize();
      return distributeCardToPlayer(playerIndex, w, h, delay, cardId);
    },
    [distributeCardToPlayer]
  );

  const distributeCardSequentially = useCallback(
    async (
      currentIndex: number,
      w: number,
      h: number,
      onComplete: () => void
    ) => {
      if (currentIndex >= players.length + 1) {
        onComplete();
        return;
      }
      const playerIndex =
        (currentIndex + (game.turn as number)) % players.length;
      await distributeCardToPlayer(playerIndex, w, h);
      await distributeCardSequentially(currentIndex + 1, w, h, onComplete);
    },
    [game.turn, players, distributeCardToPlayer]
  );

  const playBot = (player: PlayerEntity, game: GameEntity) => {
    setTimeout(async () => {
      await waitForResume();
      const { card } = determineCardForBotPlayer(player, game);
      await gameCardsRef.current?.botPlayCard(card.id as string);
      GameService.playCard({
        game,
        currentPlayer: player,
        cardIndex: player.hand.findIndex((c) => c.id === card.id),
      });
      setGame({ ...game });
      await sendCurrentCardToPlayed(card.id as string);
    }, 500);
  };

  const play = useCallback(() => {
    const player = players[game.turn as number];
    if (player.isBot) {
      playBot(player, game);
    } else {
      setNextAction('playCard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, players]);

  const initRound = useCallback(
    (game: GameEntity) => {
      playMusic('game');
      GameService.initRound(game);
      setGame({ ...game });
      const index = game.deck.findIndex((card) => card.value === 6);
      game.deck[game.deck.length - 3] = game.deck.splice(index, 1)[0];
      gameCardsRef.current?.shuffleCards({
        cards: game.deck,
        async onComplete() {
          await waitForResume();
          gameCardsRef.current?.distributeAsideCard(async () => {
            const { w, h } = await getPlayerContainerSize();
            await distributeCardSequentially(0, w, h, () => {
              GameService.distributeInitialCards(game);
              setGame({ ...game });
              play();
            });
          });
        },
      });
    },
    [play, setGame, distributeCardSequentially]
  );

  const getPlayerContainerSize = () => {
    return new Promise<{ w: number; h: number }>((resolve) => {
      playerContainerRef.current?.measureInWindow((_x, _y, w, h) => {
        resolve({ w, h });
      });
    });
  };

  const sendCurrentCardToPlayed = async (cardId: string) => {
    await sendCardToPlayed(cardId);
    setCurrentCardId(null);
    const { isEndOfRound } = GameService.checkEndOfRound(game);
    if (isEndOfRound) return;
    GameService.nextTurn(game);
    setGame({ ...game });
    await distributeCardToPlayerFromContainer(game.turn as number, 500);
    play();
  };

  const sendCardToPlayed = async (cardId: string) => {
    if (!remainingCardRef.current) return;
    await waitForResume();
    const { x, y, width } = await remainingCardRef.current.getPosition();
    await gameCardsRef.current?.sendCardToPlayed({
      cardId,
      x,
      y,
      width,
    });
  };

  const handleEffect = async (
    cardId: string,
    currentEffect: CurrentEffectType
  ) => {
    const validPlayersIds = currentEffect.validPlayersIds ?? [];
    if (
      (!validPlayersIds.length && currentEffect?.name !== 'chancellor') ||
      (!game.deck.length && currentEffect?.name === 'chancellor')
    ) {
      GameService.playEffect({
        game,
      });
      setGame({ ...game });
      await sendCurrentCardToPlayed(cardId);
      return;
    }

    switch (currentEffect?.name) {
      case 'guard':
      case 'priest':
      case 'baron':
      case 'prince':
      case 'king': {
        await pauseMusic('game');
        playMusic('targeted');
        setTargetedChoices(validPlayersIds);
        break;
      }
      case 'chancellor': {
        const cards = GameService.drawCardsEffect({
          game,
          number: 2,
        });
        for (let i = 0; i < cards.length; i++) {
          await distributeCardToPlayerFromContainer(
            game.turn as number,
            500,
            cardId
          );
        }
        setNextAction('playChancellorEffect');
        break;
      }
    }
  };

  const handlePlayCard = async (cardId: string) => {
    const currentPlayer = players.find((p) => p.id === user.id) as PlayerEntity;
    const cardIndex = currentPlayer?.hand.findIndex(
      (card) => card.id === cardId
    ) as number;
    GameService.playCard({
      game,
      currentPlayer,
      cardIndex,
    });
    setGame({ ...game });
    if (currentPlayer.currentEffect) {
      setCurrentCardId(cardId);
      await handleEffect(cardId, currentPlayer.currentEffect);
    } else {
      await sendCurrentCardToPlayed(cardId);
    }
  };

  const handleTargetedPlayer = async (playerId: number) => {
    setTargetedChoices(null);
    setTargetedPlayer(playerId);
    const player = players.find((p) => p.id === user.id) as PlayerEntity;
    if (player.currentEffect?.name === 'guard') {
      setModalGuardIsVisible(true);
    } else {
      const targetedPlayer = players.find(
        (p) => p.id === playerId
      ) as PlayerEntity;
      await applyEffectTargeted(player, targetedPlayer);
    }
  };

  const applyEffectTargeted = async (
    player: PlayerEntity,
    targetedPlayer: PlayerEntity
  ) => {
    const targetedCardId = targetedPlayer.hand[0].id as string;
    const playerCardId = player.hand.find((c) => c.id !== currentCardId)
      ?.id as string;
    const currentEffectName = player.currentEffect?.name;
    const { eliminatedPlayerId } = GameService.playEffect({
      game,
      params: {
        playerId: targetedPlayer.id,
      },
    }) as EffectResponse;
    switch (currentEffectName) {
      case 'priest': {
        await gameCardsRef.current?.showCard(targetedCardId);
        await gameCardsRef.current?.hideCard(targetedCardId);
        break;
      }
      case 'baron': {
        await gameCardsRef.current?.showCard(targetedCardId as string);
        if (eliminatedPlayerId) {
          const promises: Promise<void>[] = [
            sendCardToPlayed(
              eliminatedPlayerId === targetedPlayer.id
                ? targetedCardId
                : playerCardId
            ),
          ];
          if (eliminatedPlayerId !== targetedPlayer.id) {
            promises.push(
              gameCardsRef.current?.hideCard(targetedCardId) as Promise<void>
            );
          }
          await Promise.all(promises);
        } else {
          await gameCardsRef.current?.hideCard(targetedCardId);
        }
        break;
      }
      case 'prince': {
        const isHimself = targetedPlayer.id === player.id;
        if (!isHimself) {
          await gameCardsRef.current?.showCard(targetedCardId);
        }
        await sendCardToPlayed(targetedCardId);
        if (!eliminatedPlayerId) {
          await distributeCardToPlayerFromContainer(
            players.findIndex((p) => p.id === targetedPlayer.id),
            500,
            isHimself ? currentCardId : null
          );
        }
        break;
      }
      case 'king': {
        const { w, h } = await getPlayerContainerSize();
        const targetedPlayerIndex = players.findIndex(
          (p) => p.id === targetedPlayer.id
        );
        const playerPositions = playersPositions[0];
        const targetedPlayerPositions = playersPositions[targetedPlayerIndex];
        await gameCardsRef.current?.swapCards(
          {
            isUser: true,
            player,
            toX: (playerPositions.left / 100) * w - w / 2,
            toY: (playerPositions.top / 100) * h - h / 2,
            cardId: targetedCardId,
            currentCardId,
          },
          {
            player: targetedPlayer,
            toX: (targetedPlayerPositions.left / 100) * w - w / 2,
            toY: (targetedPlayerPositions.top / 100) * h - h / 2,
            cardId: playerCardId,
          }
        );
        break;
      }
    }
    setGame({ ...game });
    await endOfEffect();
  };

  const handleSelectGuard = async (cardValue: CardValue) => {
    if (!targetedPlayer) return;
    GameService.playEffect({
      game,
      params: {
        value: cardValue,
        playerId: targetedPlayer,
      },
    });
    setGame({ ...game });
    setModalGuardIsVisible(false);
    await endOfEffect();
  };

  const handChancellorEffect = async (cardId: string) => {
    const currentPlayer = players.find((p) => p.id === user.id) as PlayerEntity;
    GameService.playEffect({
      game,
      params: {
        cardIndex: currentPlayer.hand.findIndex((c) => c.id === cardId),
      },
    });
    setGame({ ...game });
    await endOfEffect();
  };

  const endOfEffect = async () => {
    setTargetedPlayer(null);
    await stopMusic('targeted');
    await resumeMusic('game');
    await sendCurrentCardToPlayed(currentCardId as string);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <RemainingCards ref={remainingCardRef} playedCards={playedCards} />

        <View style={styles.gameContainer} ref={playerContainerRef}>
          {players.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.playerContainer,
                {
                  top: `${playersPositions[index].top}%`,
                  left: `${playersPositions[index].left}%`,
                },
              ]}
            >
              <PlayerInfos
                player={player}
                hasSpy={!!player.cardsPlayed.find((card) => card.value === 0)}
                isActive={game.turn === index}
                isTargeted={targetedPlayer === player.id}
                isHighlighted={highlightedIndex === index}
                isTargetedChoice={targetedChoices?.includes(player.id)}
                onTarget={handleTargetedPlayer}
              />
            </View>
          ))}

          <View style={styles.deckContainer}>
            <View
              style={{
                top: windowSize.large ? -40 : windowSize.medium ? -30 : -20,
              }}
            >
              <GameCards
                ref={gameCardsRef}
                user={user}
                isPlayerTurn={
                  game.turn !== null && players[game.turn].id === user.id
                }
                playedCards={playedCards}
                setPlayedCards={setPlayedCards}
                onPlayCard={handlePlayCard}
                onChancellorEffect={handChancellorEffect}
                nextAction={nextAction}
                setNextAction={setNextAction}
                currentCardId={currentCardId}
              />
            </View>
          </View>
        </View>
      </View>
      <ModalGuard
        isVisible={modalGuardIsVisible}
        targetedCardValue={7}
        onSelect={handleSelectGuard}
        playerName={'Example'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  content: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
    height: '100%',
    maxWidth: 1024,
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckContainer: {
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
