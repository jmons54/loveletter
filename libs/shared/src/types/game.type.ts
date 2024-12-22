import type { PlayerType } from './player.type';
import type { CardType } from './card.type';
import type { GameHistoryType } from './game-history.type';
import { GameStatus } from '../utils/game.util';

export interface GameType {
  players: PlayerType[];
  deck: CardType[];
  asideCard?: CardType | null;
  turn: number | null;
  status: GameStatus;
  histories: GameHistoryType[];
}
