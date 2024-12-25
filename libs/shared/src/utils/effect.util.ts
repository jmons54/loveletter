import type { CardType, CardValue } from '../types/card.type';
import type { GameType } from '../types/game.type';
import type { PlayerType } from '../types/player.type';
import type { EffectParams, EffectResponse } from '../types/effect.type';
import { getRemainingCards } from './card.util';

export function handleEffect(
  cardPlayed: CardType,
  game: GameType,
  currentPlayer: PlayerType
) {
  switch (cardPlayed.value) {
    case 1: {
      currentPlayer.currentEffect = {
        name: 'guard',
        validPlayersIds: getValidPlayersWithoutSelfIds(game, currentPlayer),
      };
      break;
    }
    case 2: {
      currentPlayer.currentEffect = {
        name: 'priest',
        validPlayersIds: getValidPlayersWithoutSelfIds(game, currentPlayer),
      };
      break;
    }
    case 3: {
      currentPlayer.currentEffect = {
        name: 'baron',
        validPlayersIds: getValidPlayersWithoutSelfIds(game, currentPlayer),
      };
      break;
    }
    case 5: {
      currentPlayer.currentEffect = {
        name: 'prince',
        validPlayersIds: getValidPlayersIds(game),
      };
      break;
    }
    case 6: {
      currentPlayer.currentEffect = {
        name: 'chancellor',
      };
      break;
    }
    case 7: {
      currentPlayer.currentEffect = {
        name: 'king',
        validPlayersIds: getValidPlayersWithoutSelf(game, currentPlayer).map(
          (p) => p.id
        ),
      };
      break;
    }
  }
}

export function applyEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params?: EffectParams
) {
  let effectResponse: EffectResponse | null = null;

  if (params) {
    switch (currentPlayer.currentEffect?.name) {
      case 'guard':
        effectResponse = applyGuardEffect(game, currentPlayer, params);
        break;
      case 'priest':
        effectResponse = applyPriestEffect(game, currentPlayer, params);
        break;
      case 'baron':
        effectResponse = applyBaronEffect(game, currentPlayer, params);
        break;
      case 'prince':
        effectResponse = applyPrinceEffect(game, currentPlayer, params);
        break;
      case 'chancellor':
        effectResponse = applyChancellorEffect(game, currentPlayer, params);
        break;
      case 'king':
        effectResponse = applyKingEffect(game, currentPlayer, params);
        break;
    }
  }

  return effectResponse;
}

export function applyGuardEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params: EffectParams
) {
  const effectResponse: EffectResponse = {
    name: 'guard',
  };
  if (params.value !== 1) {
    const player = getValidPlayersWithoutSelf(game, currentPlayer).find(
      (player) => player.id === params.playerId
    );
    if (player) {
      effectResponse.targetPlayerId = player.id;
    }
    if (player && player.hand[0].value === params.value) {
      effectResponse.eliminatedPlayerId = player.id;
      effectResponse.eliminatedCardValue = params.value;
      eliminatePlayer(player);
    }
  }

  return effectResponse;
}

export function applyPriestEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params: EffectParams
) {
  const effectResponse: EffectResponse = {
    name: 'priest',
  };
  const player = getValidPlayersWithoutSelf(game, currentPlayer).find(
    (player) => player.id === params.playerId
  );
  if (player) {
    effectResponse.targetPlayerId = player.id;
    effectResponse.seeCard = player.hand[0].value;
  }
  return effectResponse;
}

export function applyBaronEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params: EffectParams
): EffectResponse {
  const effectResponse: EffectResponse = {
    name: 'baron',
  };

  const player = getValidPlayerWithoutSelf(
    game,
    currentPlayer,
    params.playerId
  );
  if (player) {
    effectResponse.targetPlayerId = player.id;
    const remainingCards = getRemainingCards(game);
    const currentPlayerCardValue = currentPlayer.hand[0].value;
    const playerCardValue = player.hand[0].value;
    let eliminatedPlayerId: number | null = null;
    let eliminatedCardValue: CardValue | null = null;
    if (currentPlayerCardValue > playerCardValue) {
      eliminatedPlayerId = player.id;
      eliminatedCardValue = playerCardValue;
      eliminatePlayer(player);
    } else if (currentPlayerCardValue < playerCardValue) {
      eliminatedPlayerId = currentPlayer.id;
      eliminatedCardValue = currentPlayerCardValue;
      eliminatePlayer(currentPlayer);
    } else {
      effectResponse.baronEqualityCardValue = currentPlayer.hand[0].value;
      effectResponse.potentialCardValues = Array.from(
        { length: 7 },
        (_, val) => val
      ).filter(
        (value) =>
          remainingCards.filter((card) => card.value === value).length >= 2
      ) as CardValue[];
    }
    if (eliminatedPlayerId !== null && eliminatedCardValue !== null) {
      effectResponse.eliminatedPlayerId = eliminatedPlayerId;
      effectResponse.eliminatedCardValue = eliminatedCardValue;
      effectResponse.potentialCardValues = remainingCards
        .filter((card) => card.value > playerCardValue)
        .map((c) => c.value);
    }
  }
  return effectResponse;
}

export function applyPrinceEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params: EffectParams
): EffectResponse {
  const effectResponse: EffectResponse = {
    name: 'prince',
  };
  const player = getValidPlayer(game, currentPlayer, params.playerId);

  effectResponse.targetPlayerId = player.id;

  const discardedCard = player.hand[0];

  if (discardedCard && discardedCard.value === 9) {
    effectResponse.eliminatedPlayerId = player.id;
    effectResponse.eliminatedCardValue = 9;
    eliminatePlayer(player);
  } else {
    player.hand = [];
    player.cardsPlayed.push(discardedCard);
    const newCard = game.deck.pop();
    if (newCard) {
      player.hand.push(newCard);
    } else if (game.asideCard) {
      player.hand.push(game.asideCard);
      game.asideCard = null;
    }
  }
  return effectResponse;
}

export function applyChancellorEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params: EffectParams
) {
  const effectResponse: EffectResponse = {
    name: 'chancellor',
  };

  let chosenCard = params.cardIndex
    ? currentPlayer.hand[params.cardIndex]
    : null;
  if (!chosenCard) {
    chosenCard = currentPlayer.hand[0] as CardType;
  }

  effectResponse.chosenCard = chosenCard.value;

  currentPlayer.hand = currentPlayer.hand.filter((card) => card !== chosenCard);
  const remainingCards = currentPlayer.hand;
  effectResponse.remainingCards = { ...remainingCards };
  game.deck.unshift(...remainingCards);
  currentPlayer.hand = [chosenCard];
  return effectResponse;
}

export function applyKingEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params: EffectParams
) {
  const effectResponse: EffectResponse = {
    name: 'king',
  };
  const targetPlayer = getValidPlayerWithoutSelf(
    game,
    currentPlayer,
    params.playerId
  );
  effectResponse.targetPlayerId = targetPlayer.id;
  effectResponse.playerSwapCard = currentPlayer.hand[0].value;
  effectResponse.targetPlayerSwapCard = targetPlayer.hand[0].value;
  const tempHand = currentPlayer.hand;
  currentPlayer.hand = targetPlayer.hand;
  targetPlayer.hand = tempHand;
  return effectResponse;
}

export function getValidPlayer(
  game: GameType,
  currentPlayer: PlayerType,
  playerId?: number
) {
  let player = getValidPlayers(game).find((player) => player.id === playerId);
  if (!player) {
    player = currentPlayer;
  }
  return player;
}

export function getValidPlayers(game: GameType) {
  return game.players.filter(
    (player) => !player.isEliminated && !player.isProtected
  );
}

export function getValidPlayersIds(game: GameType) {
  return getValidPlayers(game).map((player) => player.id);
}

export function getValidPlayerWithoutSelf(
  game: GameType,
  currentPlayer: PlayerType,
  playerId?: number
) {
  const players = getValidPlayersWithoutSelf(game, currentPlayer);
  let player = players.find((player) => player.id === playerId);
  if (!player) {
    player = players[0];
  }
  return player;
}

export function getValidPlayersWithoutSelf(
  game: GameType,
  currentPlayer: PlayerType
) {
  return getValidPlayers(game).filter(
    (player) => player.id !== currentPlayer.id
  );
}

export function getValidPlayersWithoutSelfIds(
  game: GameType,
  currentPlayer: PlayerType
) {
  return getValidPlayersWithoutSelf(game, currentPlayer).map(
    (player) => player.id
  );
}

function eliminatePlayer(player: PlayerType) {
  player.isEliminated = true;
  if (player.hand.length) {
    player.cardsPlayed.push(...player.hand);
    player.hand = [];
  }
}
