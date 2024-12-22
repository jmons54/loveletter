import { useEffect, useState } from 'react';
import { GameStatus, NumberOfPlayers } from '@shared';
import { GameService, PlayerEntity } from '@offline';

export function useInitGame(
  gameStatus: GameStatus,
  players: PlayerEntity[],
  isGamePaused: boolean,
  onCompleted: (turn: number) => void
) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (gameStatus === GameStatus.INITIALIZED && !isGamePaused) {
      const turn = GameService.getStartingPlayer(
        players.length as NumberOfPlayers
      );
      let currentIndex = 0;
      const timer = setInterval(() => {
        if (
          currentIndex >= players.length &&
          currentIndex % players.length === turn
        ) {
          clearInterval(timer);
          setHighlightedIndex(null);
          onCompleted(turn);
        } else {
          setHighlightedIndex(currentIndex % players.length);
          currentIndex++;
        }
      }, 200);

      return () => clearInterval(timer);
    }
    if (isGamePaused) {
      setHighlightedIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus, players, isGamePaused, setHighlightedIndex]);

  return { highlightedIndex };
}