import type { GameType } from '../types/game.type';
import type { CardType } from '../types/card.type';
import type { PlayerType } from '../types/player.type';
import type { EffectParams } from '../types/effect.type';
import { getShuffleDeck } from './card.util';
import { applyEffect, handleEffect } from './effect.util';

export enum GameStatus {
  INITIALIZED = 'initialized',
  IN_PROGRESS = 'inProgress',
  ROUND_ENDED = 'roundEnded',
  FINISHED = 'finished',
}

export type NumberOfPlayers = 2 | 3 | 4 | 5 | 6;

export function getStartingPlayer(numberOfPlayers: NumberOfPlayers) {
  return Math.floor(Math.random() * numberOfPlayers);
}

export function initRound(game: GameType) {
  const deck = getShuffleDeck();

  game.status = GameStatus.IN_PROGRESS;
  game.deck = deck;

  return game;
}

export function distributeInitialCards(game: GameType) {
  game.asideCard = game.deck.pop();
  const players = game.players;
  const totalPlayers = players.length;
  for (let i = 0; i < totalPlayers; i++) {
    const playerIndex = ((game.turn as number) + i) % totalPlayers;
    players[playerIndex].hand = [game.deck.pop() as CardType];
  }
  drawCard(game);
  return game;
}

export function getNextTurn(game: GameType): number | null {
  const totalPlayers = game.players.length;
  for (let i = 1; i <= totalPlayers; i++) {
    const nextTurn = ((game.turn as number) + i) % totalPlayers;
    if (!game.players[nextTurn].isEliminated) {
      return nextTurn;
    }
  }
  return null;
}

export function drawCard(game: GameType) {
  const currentPlayer = game.players[game.turn as number];
  const drawnCard = game.deck.pop();
  if (drawnCard) {
    currentPlayer.hand.push(drawnCard);
  }
  currentPlayer.mustPlayCountess = mustPlayCountess(currentPlayer.hand);
  return drawnCard;
}

export function drawCardsEffect(
  game: GameType,
  number: number,
  useAsideCard = false,
  currentPlayer?: PlayerType
) {
  if (!currentPlayer) {
    currentPlayer = game.players[game.turn as number];
  }
  let drawnCards = game.deck.slice(-number);
  if (useAsideCard && !drawnCards.length) {
    drawnCards = [game.asideCard as CardType];
    game.asideCard = null;
  }
  if (drawnCards.length) {
    game.deck.splice(-drawnCards.length);
    currentPlayer.hand.push(...drawnCards);
  }
  return drawnCards;
}

export const mustPlayCountess = (hand: CardType[]) =>
  hand.some((card) => card.value === 8) &&
  (hand.some((card) => card.value === 5) ||
    hand.some((card) => card.value === 7));

export function getCardIndexToPlay(
  currentPlayer: PlayerType,
  cardIndex: number
) {
  let card: CardType;
  if (cardIndex === 0) {
    card = currentPlayer.hand[0];
  } else {
    card = currentPlayer.hand[1];
  }

  if (currentPlayer.mustPlayCountess) {
    if (card.value !== 8) {
      cardIndex = currentPlayer.hand.findIndex((card) => card.value === 8);
    }
  }
  return cardIndex;
}

export function playCard(
  game: GameType,
  currentPlayer: PlayerType,
  cardIndex: number,
  apply = true
) {
  const cardPlayed = currentPlayer.hand.splice(cardIndex, 1)[0];
  currentPlayer.cardsPlayed.push(cardPlayed);

  currentPlayer.isProtected = cardPlayed.value === 4;

  if (cardPlayed.value === 9) {
    currentPlayer.isEliminated = true;
    if (currentPlayer.hand) {
      currentPlayer.cardsPlayed.push(currentPlayer.hand.pop() as CardType);
    }
  } else {
    handleEffect(cardPlayed, game, currentPlayer, apply);
  }

  currentPlayer.mustPlayCountess = false;

  game.histories?.push({
    playerId: currentPlayer.id,
    cardPlayed,
    cardRemaining: currentPlayer.hand[0],
  });

  return cardPlayed;
}

export function playEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params?: EffectParams,
  apply = true
) {
  const effectResponse = applyEffect(game, currentPlayer, params, apply);

  currentPlayer.currentEffect = null;

  game.histories?.push({
    playerId: currentPlayer.id,
    effect: effectResponse,
  });

  return effectResponse;
}

export function getPointsRequiredForWin(playerCount: number): number {
  switch (playerCount) {
    case 2:
      return 6;
    case 3:
      return 5;
    case 4:
      return 4;
    default:
      return 3;
  }
}

export function endOfRound(game: GameType) {
  game.deck = [];
  game.asideCard = null;
  game.players.forEach((player) => {
    player.hand = [];
    player.cardsPlayed = [];
    player.isEliminated = false;
  });
}

export function checkEndOfRound(game: GameType) {
  const alivePlayers = game.players.filter((player) => !player.isEliminated);

  let winners: PlayerType[] | null = null;
  let lastRoundWinner: PlayerType | null = null;

  if (alivePlayers.length === 1 || game.deck.length === 0) {
    winners = getHighestCardPlayers(alivePlayers);
    winners.forEach((player) => {
      player.score += 1;
    });
    if (winners.length === 1) {
      lastRoundWinner = winners[0] as PlayerType;
    }
    const playersWithSpies = alivePlayers.filter((player) =>
      playerHaveSpies(player)
    );
    if (playersWithSpies.length === 1) {
      const [player] = playersWithSpies;
      player.score += 1;
      if (!lastRoundWinner && winners.length > 1) {
        lastRoundWinner = winners.find(
          (highestCardPlayer) => highestCardPlayer.id === player.id
        ) as PlayerType;
      }
    }
    if (!lastRoundWinner) {
      const randomIndex = Math.floor(Math.random() * winners.length);
      lastRoundWinner = winners[randomIndex];
    }

    const players = game.players
      .filter((player) => !player.isEliminated)
      .map((player) => ({
        playerId: player.id,
        card: player.hand[0],
        winner: !!winners?.find((h) => h.id === player.id),
        spy:
          playersWithSpies.length === 1 && playersWithSpies[0].id === player.id,
      }));

    game.histories?.push({
      endOfRound: players,
    });

    game.status = GameStatus.ROUND_ENDED;
    game.turn = game.players.indexOf(lastRoundWinner);

    return {
      isEndOfRound: true,
      players,
    };
  }

  return {
    isEndOfRound: false,
  };
}

export function checkEndOfGame(game: GameType) {
  const pointsNeeded = getPointsRequiredForWin(game.players.length);
  const winner = game.players.find((player) => player.score >= pointsNeeded);
  if (winner) {
    game.status = GameStatus.FINISHED;
  }
  return !!winner;
}

function getHighestCardPlayers(players: PlayerType[]) {
  const maxCardValue = players.reduce(
    (max, player) => Math.max(max, player.hand[0].value),
    -Infinity
  );

  return players.filter((player) => player.hand[0].value === maxCardValue);
}

function playerHaveSpies(player: PlayerType) {
  return !!player.cardsPlayed.find((card) => card.value === 0);
}
