import type { CardType, CardValue } from './card.type';

export type EffectName =
  | 'guard'
  | 'priest'
  | 'baron'
  | 'prince'
  | 'chancellor'
  | 'king';

export interface EffectParams {
  playerId?: number;
  cardIndex?: number;
  value?: CardValue;
  remainingCards?: CardType[];
}

export interface EffectResponse {
  name: EffectName;
  targetPlayerId?: number;
  seeCard?: CardValue;
  chosenCard?: CardValue;
  remainingCards?: CardType[];
  playerSwapCard?: CardValue;
  targetPlayerSwapCard?: CardValue;
  baronEqualityCardValue?: CardValue;
  potentialCardValues?: CardValue[];
  eliminatedPlayerId?: number;
  eliminatedCardValue?: CardValue;
}
