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
import { determineCardForBotPlayer } from '@shared';
import { RemainingCards, RemainingCardsHandle } from './remainingCards';
import { useWindowSize } from '../hook/useWindowSize';
import { calculatePlayerPositions } from '../utils/position';
import { useInitGame } from '../hook/useInitGame';
import { playMusic } from '../utils/sound';

interface GameViewProps {
  user: UserType;
  game: GameEntity;
  isGamePaused: boolean;
  setGame: Dispatch<SetStateAction<GameEntity | null>>;
}

export function GameView({ user, game, isGamePaused, setGame }: GameViewProps) {
  const windowSize = useWindowSize();

  const deckRef = useRef<GameCardsHandle | null>(null);
  const remainingCardRef = useRef<RemainingCardsHandle | null>(null);
  const playerContainerRef = useRef<View | null>(null);

  const [playedCards, setPlayedCards] = useState<GameCard[]>([]);
  const [nextAction, setNextAction] = useState<'playBot' | 'playCard' | null>(
    null
  );
  const isGamePausedRef = useRef(isGamePaused);

  useEffect(() => {
    isGamePausedRef.current = isGamePaused;
  }, [isGamePaused]);

  const players = useMemo(() => game.players, [game.players]);
  const playerPositions = calculatePlayerPositions(players.length);

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
    async (playerIndex: number, w: number, h: number, delay = 0) => {
      await waitForResume();
      return new Promise<void>((resolve) => {
        const { top, left } = playerPositions[playerIndex];
        const toX = (left / 100) * w - w / 2;
        const toY = (top / 100) * h - h / 2;
        deckRef.current?.distributeCardToPlayer({
          player: players[playerIndex],
          toX,
          toY,
          delay,
          onComplete() {
            resolve();
          },
        });
      });
    },
    [playerPositions, players]
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
      const { card, effect } = determineCardForBotPlayer(player, game);
      await deckRef.current?.botPlayCard(card.id as string);
      GameService.playCard(
        game,
        player,
        player.hand.findIndex((c) => c.id === card.id)
      );
      setGame({ ...game });
      await sendCardToPlayed(card.id as string);
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
      deckRef.current?.shuffleCards({
        cards: game.deck,
        async onComplete() {
          await waitForResume();
          deckRef.current?.distributeAsideCard(async () => {
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

  const sendCardToPlayed = async (cardId: string) => {
    if (!remainingCardRef.current) return;
    await waitForResume();
    const { x, y, width } = await remainingCardRef.current.getPosition();
    await deckRef.current?.sendCardToPlayed({
      cardId,
      x,
      y,
      width,
    });
    const { isEndOfRound } = GameService.checkEndOfRound(game);
    if (isEndOfRound) return;
    GameService.nextTurn(game);
    setGame({ ...game });
    const { w, h } = await getPlayerContainerSize();
    await distributeCardToPlayer(game.turn as number, w, h, 500);
    play();
  };

  const onPlayCard = async (cardId: string) => {
    const player = players.find((p) => p.id === user.id) as PlayerEntity;
    const cardIndex = player?.hand.findIndex(
      (card) => card.id === cardId
    ) as number;
    GameService.playCard(game, player, cardIndex);
    setGame({ ...game });
    await sendCardToPlayed(cardId);
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
                  top: `${playerPositions[index].top}%`,
                  left: `${playerPositions[index].left}%`,
                },
              ]}
            >
              <PlayerInfos
                player={player}
                hasSpy={!!player.cardsPlayed.find((card) => card.value === 0)}
                isActive={game.turn === index}
                isTargeted={false}
                isHighlighted={highlightedIndex === index} // Highlight current player
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
                ref={deckRef}
                user={user}
                isPlayerTurn={
                  game.turn !== null && players[game.turn].id === user.id
                }
                playedCards={playedCards}
                setPlayedCards={setPlayedCards}
                onPlayCard={onPlayCard}
                nextAction={nextAction}
                setNextAction={setNextAction}
                isGamePaused={isGamePaused}
              />
            </View>
          </View>
        </View>
      </View>
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
