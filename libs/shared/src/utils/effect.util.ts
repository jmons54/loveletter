import type { CardType, CardValue } from '../types/card.type';
import type { GameType } from '../types/game.type';
import type { PlayerType } from '../types/player.type';
import type { EffectParams, EffectResponse } from '../types/effect.type';
import { getCardsFromDeck, getRemainingCards } from './card.util';

export function handleEffect(
  cardPlayed: CardType,
  game: GameType,
  currentPlayer: PlayerType,
  apply: boolean
) {
  switch (cardPlayed.value) {
    case 1: {
      handleGuardEffect(game, currentPlayer);
      break;
    }
    case 2: {
      handlePriestEffect(game, currentPlayer);
      break;
    }
    case 3: {
      handleBaronEffect(game, currentPlayer);
      break;
    }
    case 5: {
      handlePrinceEffect(game, currentPlayer);
      break;
    }
    case 6: {
      handleChancellorEffect(game, currentPlayer, apply);
      break;
    }
    case 7: {
      handleKingEffect(game, currentPlayer);
      break;
    }
  }
}

function handleGuardEffect(game: GameType, currentPlayer: PlayerType) {
  currentPlayer.currentEffect = {
    name: 'guard',
    validPlayersIds: getValidPlayersWithoutSelfIds(game, currentPlayer),
  };
}

function handlePriestEffect(game: GameType, currentPlayer: PlayerType) {
  currentPlayer.currentEffect = {
    name: 'priest',
    validPlayersIds: getValidPlayersWithoutSelfIds(game, currentPlayer),
  };
}

function handleBaronEffect(game: GameType, currentPlayer: PlayerType) {
  currentPlayer.currentEffect = {
    name: 'baron',
    validPlayersIds: getValidPlayersWithoutSelfIds(game, currentPlayer),
    required: true,
  };
}

function handlePrinceEffect(game: GameType, currentPlayer: PlayerType) {
  currentPlayer.currentEffect = {
    name: 'prince',
    validPlayersIds: getValidPlayersIds(game),
    required: true,
  };
}

export function handleChancellorEffect(
  game: GameType,
  currentPlayer: PlayerType,
  apply: boolean
) {
  const drawnCards = getCardsFromDeck(game, 2);
  if (drawnCards.length) {
    currentPlayer.currentEffect = {
      name: 'chancellor',
      required: true,
    };
    if (apply) {
      game.deck.splice(-drawnCards.length);
      currentPlayer.hand.push(...drawnCards);
    }
  }
  return drawnCards;
}

function handleKingEffect(game: GameType, currentPlayer: PlayerType) {
  currentPlayer.currentEffect = {
    name: 'king',
    validPlayersIds: getValidPlayersWithoutSelf(game, currentPlayer).map(
      (p) => p.id
    ),
    required: true,
  };
}

export function applyEffect(
  game: GameType,
  currentPlayer: PlayerType,
  params?: EffectParams,
  apply = true
) {
  let effectResponse: EffectResponse | null = null;

  if (params) {
    switch (currentPlayer.currentEffect?.name) {
      case 'guard':
        effectResponse = applyGuardEffect(game, currentPlayer, params, apply);
        break;
      case 'priest':
        effectResponse = applyPriestEffect(game, currentPlayer, params);
        break;
      case 'baron':
        effectResponse = applyBaronEffect(game, currentPlayer, params, apply);
        break;
      case 'prince':
        effectResponse = applyPrinceEffect(game, currentPlayer, params, apply);
        break;
      case 'chancellor':
        effectResponse = applyChancellorEffect(
          game,
          currentPlayer,
          params,
          apply
        );
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
  params: EffectParams,
  apply: boolean
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
      effectResponse.playerEliminatedId = player.id;
      effectResponse.playerEliminatedCardValue = params.value;
      eliminatePlayer(player, apply);
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
  params: EffectParams,
  apply: boolean
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
    let playerEliminatedId: number | null = null;
    let playerEliminatedCardValue: CardValue | null = null;
    if (currentPlayerCardValue > playerCardValue) {
      playerEliminatedId = player.id;
      playerEliminatedCardValue = playerCardValue;
      eliminatePlayer(player, apply);
    } else if (currentPlayerCardValue < playerCardValue) {
      playerEliminatedId = currentPlayer.id;
      playerEliminatedCardValue = currentPlayerCardValue;
      eliminatePlayer(currentPlayer, apply);
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
    if (playerEliminatedId !== null && playerEliminatedCardValue !== null) {
      effectResponse.playerEliminatedId = playerEliminatedId;
      effectResponse.playerEliminatedCardValue = playerEliminatedCardValue;
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
  params: EffectParams,
  apply: boolean
): EffectResponse {
  const effectResponse: EffectResponse = {
    name: 'prince',
  };
  const player = getValidPlayer(game, currentPlayer, params.playerId);

  effectResponse.targetPlayerId = player.id;

  const discardedCard = player.hand[0];

  if (discardedCard && discardedCard.value === 9) {
    effectResponse.playerEliminatedId = player.id;
    effectResponse.playerEliminatedCardValue = 9;
    eliminatePlayer(player, apply);
  } else if (apply) {
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
  params: EffectParams,
  apply: boolean
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

  if (apply) {
    currentPlayer.hand = currentPlayer.hand.filter(
      (card) => card !== chosenCard
    );
    const remainingCards = currentPlayer.hand;
    effectResponse.remainingCards = { ...remainingCards };
    game.deck.unshift(...remainingCards);
    currentPlayer.hand = [chosenCard];
  } else {
    effectResponse.remainingCards = {
      ...currentPlayer.hand.filter((card) => card !== chosenCard),
    };
  }
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

function eliminatePlayer(player: PlayerType, apply: boolean) {
  if (apply) {
    player.isEliminated = true;
    if (player.hand.length) {
      player.cardsPlayed.push(...player.hand);
      player.hand = [];
    }
  }
}
