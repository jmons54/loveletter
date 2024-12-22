import {
  checkEndOfGame,
  checkEndOfRound,
  distributeInitialCards,
  drawCard,
  EffectParams,
  endOfRound,
  generateName,
  generateShortName,
  getCardIndexToPlay,
  getNextTurn,
  getStartingPlayer,
  initRound,
  NumberOfPlayers,
  playCard,
  playEffect,
} from '@shared';
import { PlayerEntity } from '../entities/player.entity';
import { GameEntity } from '../entities/game.entity';

export class GameService {
  static initGame(
    users: {
      id: number;
      name: string;
      avatar: string | ImageData;
    }[],
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

  static endOfRound(game: GameEntity) {
    endOfRound(game);
    return game;
  }

  static playCard(
    game: GameEntity,
    currentPlayer: PlayerEntity,
    cardIndex: number
  ) {
    cardIndex = getCardIndexToPlay(currentPlayer, cardIndex);
    return playCard(game, currentPlayer, cardIndex, false);
  }

  static playEffect(game: GameEntity, params?: EffectParams, apply = false) {
    const currentPlayer = game.players[game.turn as number];
    return playEffect(game, currentPlayer, params, apply);
  }

  static checkEndOfRound(game: GameEntity) {
    return checkEndOfRound(game);
  }

  static checkEndOfGame(game: GameEntity) {
    return checkEndOfGame(game);
  }

  static nextTurn(game: GameEntity) {
    game.turn = getNextTurn(game) as number;
    drawCard(game);
    return game.turn;
  }
}
