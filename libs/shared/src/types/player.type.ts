import type { CardType } from './card.type';
import type { CurrentEffectType } from './current-effect.type';

export interface PlayerType {
  id: number;
  isEliminated: boolean;
  isProtected: boolean;
  hand: CardType[];
  mustPlayCountess: boolean;
  score: number;
  cardsPlayed: CardType[];
  currentEffect?: CurrentEffectType | null;
}
