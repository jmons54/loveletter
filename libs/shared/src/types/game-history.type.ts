import type { CardType } from './card.type';
import type { EffectResponse } from './effect.type';

export interface GameHistoryType {
  playerId?: number;
  cardPlayed?: CardType;
  cardRemaining?: CardType;
  effect?: EffectResponse | null;
  endOfRound?: {
    playerId: number;
    card: CardType;
    winner: boolean;
    spy: boolean;
  }[];
}
