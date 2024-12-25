import {
  checkEndOfGame,
  checkEndOfRound,
  distributeInitialCards,
  drawCard,
  DrawCardEffectProps,
  drawCardsEffect,
  endOfRound,
  generateName,
  generateShortName,
  getNextTurn,
  getStartingPlayer,
  initRound,
  NumberOfPlayers,
  playCard,
  playEffect,
  PlayEffectProps,
  PlayerCardProps,
} from '@shared';
import { PlayerEntity } from '../entities/player.entity';
import { GameEntity } from '../entities/game.entity';

export class GameService {
  static initGame(
    users: Pick<PlayerEntity, 'id' | 'name' | 'avatar'>[],
    numberOfPlayers: NumberOfPlayers,
    shortName = true
  ): GameEntity {
    const players: PlayerEntity[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const player = new PlayerEntity(user.id, user.name);
      player.avatar = user.avatar;
      players.push(player);
    }

    for (let i = players.length; i < numberOfPlayers; i++) {
      const player = new PlayerEntity(
        i + 1,
        shortName ? generateShortName() : generateName(),
        true
      );
      players.push(player);
    }

    return new GameEntity(players);
  }

  static getStartingPlayer(numberOfPlayers: NumberOfPlayers) {
    return getStartingPlayer(numberOfPlayers);
  }

  static initTurn(game: GameEntity, turn: number) {
    game.turn = turn;
    return game;
  }

  static initRound(game: GameEntity) {
    initRound(game);
    return game;
  }

  static distributeInitialCards(game: GameEntity) {
    distributeInitialCards(game);
    return game;
  }

  static nextTurn(game: GameEntity) {
    game.turn = getNextTurn(game) as number;
    drawCard(game);
    return game.turn;
  }

  static drawCardsEffect(props: DrawCardEffectProps) {
    return drawCardsEffect(props);
  }

  static playCard(props: PlayerCardProps) {
    return playCard(props);
  }

  static playEffect(props: PlayEffectProps) {
    return playEffect(props);
  }

  static checkEndOfRound(game: GameEntity) {
    return checkEndOfRound(game);
  }

  static endOfRound(game: GameEntity) {
    endOfRound(game);
    return game;
  }

  static checkEndOfGame(game: GameEntity) {
    return checkEndOfGame(game);
  }
}
