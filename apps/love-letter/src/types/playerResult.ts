import type { CardType } from '@shared';

export interface PlayerResult {
  playerId: number;
  card: CardType;
  winner: boolean;
  spy: boolean;
}
