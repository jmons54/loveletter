import { CardType, CurrentEffectType, PlayerType } from '@shared';

export class PlayerEntity implements PlayerType {
  constructor(
    public readonly id: number,
    public name: string,
    public readonly isBot = false
  ) {}

  avatar?: string | ImageData;

  isEliminated = false;

  isProtected = false;

  hand: CardType[] = [];

  mustPlayCountess = false;

  score = 0;

  cardsPlayed: CardType[] = [];

  currentEffect?: CurrentEffectType | null;
}
