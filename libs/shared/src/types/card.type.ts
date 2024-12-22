export type CardValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CardName =
  | 'spy'
  | 'guard'
  | 'priest'
  | 'baron'
  | 'handmaid'
  | 'prince'
  | 'chancellor'
  | 'king'
  | 'countess'
  | 'princess';
export type CardType = {
  id?: string;
  value: CardValue;
  name: CardName;
  visible?: boolean;
};
