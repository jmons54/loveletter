import { CardType, GameType, GameHistoryType, GameStatus } from '@shared';
import { PlayerEntity } from './player.entity';

export class GameEntity implements GameType {
  constructor(public players: PlayerEntity[]) {}

  turn: number | null = null;

  deck: CardType[] = [];

  asideCard?: CardType;

  status = GameStatus.INITIALIZED;

  histories: GameHistoryType[] = [];
}
