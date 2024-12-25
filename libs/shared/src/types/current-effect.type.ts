export interface CurrentEffectType {
  name: 'guard' | 'priest' | 'baron' | 'prince' | 'chancellor' | 'king';
  validPlayersIds?: number[];
}
