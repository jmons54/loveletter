import type { PlayerType } from '../types/player.type';
import type { GameType } from '../types/game.type';
import type { CardType, CardValue } from '../types/card.type';
import type { EffectParams } from '../types/effect.type';
import type { CurrentEffectType } from '../types/current-effect.type';
import type { GameHistoryType } from '../types/game-history.type';
import { getDeck } from './card.util';
import { getPointsRequiredForWin } from './game.util';

interface BotCardResponse {
  card: CardType;
  effect?: EffectParams;
}

interface DeducedCard {
  playerId: number;
  value: CardValue;
}

interface DeduceFromBaron {
  player: PlayerType;
  possibleValues: CardValue[];
}

interface ShouldDiscardCard {
  value?: CardValue;
  minValue?: CardValue;
  opponent?: PlayerType;
  countess?: boolean;
}

interface PossibleTargetActions {
  hasSeenCard?: DeducedCard;
  deducedFromBaronEquality?: DeduceFromBaron | DeduceFromBaron[];
  deducedFromBaronWinner?: DeduceFromBaron;
  deducedFromCountess?: DeducedCard;
  deducedFromKingExchange?: DeducedCard;
}

interface PlayerWithRemainingCards {
  id: number;
  remainingCards: CardType[];
  priority: number;
}

const cardPriority = {
  spy: 5,
  handmaid: 5,
  guard: 4,
  priest: 3,
  chancellor: 3,
  baron: 2,
  prince: 2,
  king: 1,
  countess: 1,
  princess: 0,
} as const;

export function determineCardForBotPlayer(
  playerEntity: PlayerType,
  gameEntity: GameType
) {
  const player = JSON.parse(JSON.stringify(playerEntity)) as PlayerType;
  const game = JSON.parse(JSON.stringify(gameEntity)) as GameType;
  if (player.hand.length !== 2) {
    throw new Error('Player hand must have 2 cards');
  }

  const [card1, card2] = player.hand;

  if (card1.value === 9) return { card: card2 };
  if (card2.value === 9) return { card: card1 };

  if (player.mustPlayCountess) {
    if (card1.value === 8) return { card: card1 };
    if (card2.value === 8) return { card: card2 };
  }

  if (card1.value === card2.value) {
    return { card: card1 };
  }

  if (card1.value === 8 || card2.value === 8) {
    const roundStage = getRoundStage(game);
    if (roundStage === 'late') {
      const useBluff = Math.random() <= 0.2;
      if (useBluff) {
        return { card: card1.value === 8 ? card1 : card2 };
      }
    }
  }

  const contextSensitiveLogic = handleContextualLogic(
    card1,
    card2,
    game,
    player
  );
  if (contextSensitiveLogic) {
    const data = contextSensitiveLogic;
    const card = player.hand.find((c) => c.id === data.card.id);
    if (!card) {
      return { card: card1 };
    }
    return data;
  }

  return cardPriority[card1.name] > cardPriority[card2.name]
    ? { card: card1 }
    : { card: card2 };
}

export function determineEffectForBotPlayer(
  playerEntity: PlayerType,
  gameEntity: GameType,
  effect: CurrentEffectType
): EffectParams {
  const player = structuredClone(playerEntity);
  const game = structuredClone(gameEntity);
  const validTargets = getValidTargets(game, player);
  if (effect.name !== 'chancellor' && !validTargets.length) {
    return {};
  }

  const gameStatus = getGameStatus(game, player.id);
  const [card] = player.hand;

  function getTargetPlayer() {
    const hasSpy = player.cardsPlayed.some((card) => card.name === 'spy');
    if (hasSpy && gameStatus !== 'critical') {
      const targetPlayer = game.players.find(
        (p) =>
          p.id !== player.id &&
          !p.isEliminated &&
          p.cardsPlayed.some((card) => card.value === 0)
      );
      if (targetPlayer) return targetPlayer;
    }
    return getTopPlayerToTarget(game, player);
  }

  switch (effect.name) {
    case 'guard': {
      if (gameStatus !== 'critical') {
        const players = getPotentialCards(game, player).map((player) => ({
          ...player,
          remainingCards: player.remainingCards.filter((c) => c.value !== 1),
        }));
        const playersWithProbabilities = calculateCardProbabilities(players);

        const bestGuessTarget = getBestGuessTarget(playersWithProbabilities);
        if (bestGuessTarget) {
          return {
            playerId: bestGuessTarget.playerId,
            value: getRandomValue(bestGuessTarget.cardProbabilities).cardValue,
          };
        }
      }
      const target = getTargetPlayer();
      const cards = findMaxPossibleCards(
        getRemainingCards(game, player).filter((c) => c.value !== 1)
      );
      return { playerId: target?.id, value: getRandomValue(cards).value };
    }
    case 'priest': {
      const target = getTargetPlayer();
      return { playerId: target?.id };
    }
    case 'baron': {
      let playerId: number | null = null;
      if (gameStatus !== 'critical') {
        const playerCardValue = player.hand[0].value;
        const players = getPotentialCards(game, player);
        const probabilities = calculateBaronProbabilities(
          players,
          playerCardValue
        );
        const bestTarget = getBestBaronTarget(probabilities);
        if (bestTarget) {
          playerId = bestTarget;
        }
      }
      return { playerId: playerId ? playerId : getTargetPlayer()?.id };
    }
    case 'prince': {
      const roundStage = getRoundStage(game);
      if (roundStage === 'late' && hasBestCardInDeck(game, player, card)) {
        return { playerId: player.id };
      } else {
        const target = getTargetPlayer();
        return { playerId: target?.id };
      }
    }
    case 'chancellor': {
      const roundStage = getRoundStage(game);
      const remainingDeck = getRemainingCards(game, player);
      const cardsToDraw = remainingDeck.slice(0, 2); // Pioche les deux premières cartes restantes

      const allCardsInHand = [...player.hand, ...cardsToDraw];

      const bestCard = allCardsInHand.reduce((best, current) =>
        current.value > best.value ? current : best
      );

      let cardToKeep = bestCard;

      if (
        (roundStage === 'early' && bestCard.value > 6) ||
        (roundStage === 'mid' && bestCard.value === 9)
      ) {
        const weakerCards = allCardsInHand.filter((c) => c.value <= 6);
        if (weakerCards.length > 0) {
          cardToKeep = weakerCards.reduce((best, current) =>
            current.value > best.value ? current : best
          );
        }
      }

      const cardsToReturn = allCardsInHand.filter(
        (c) => c.id !== cardToKeep.id
      );

      cardsToReturn.sort((a, b) => a.value - b.value); // Plus faibles en premier

      return {
        cardIndex: allCardsInHand.findIndex((c) => c.id === cardToKeep.id),
        remainingCards: cardsToReturn,
      };
    }
    case 'king': {
      const isBestCard = hasBestCardInDeck(game, player, card);
      if (isBestCard) {
        const target = getBottomPlayerToTarget(game, player);
        return { playerId: target?.id };
      }
      const target = getTargetPlayer();
      return { playerId: target?.id };
    }
  }
}

function getBestGuessTarget(
  playersWithProbabilities: {
    playerId: number;
    cardProbabilities: { cardValue: CardValue; probability: number }[];
    mostProbableCard: { cardValue: CardValue; probability: number };
  }[]
) {
  const maxProbability = Math.max(
    ...playersWithProbabilities.map((p) => p.mostProbableCard.probability)
  );

  const bestTargets = playersWithProbabilities.filter(
    (p) => p.mostProbableCard.probability === maxProbability
  );
  return getRandomValue(bestTargets);
}

function calculateCardProbabilities(players: PlayerWithRemainingCards[]) {
  return players
    .filter((player) => player.remainingCards.length)
    .map((player) => {
      const totalCards = player.remainingCards.length;

      const frequencyMap = player.remainingCards.reduce<Record<number, number>>(
        (acc, card) => {
          acc[card.value] = (acc[card.value] || 0) + 1;
          return acc;
        },
        {}
      );

      const cardProbabilities = Object.entries(frequencyMap).map(
        ([value, count]) => ({
          cardValue: Number(value) as CardValue,
          probability: count / totalCards,
        })
      );

      const mostProbableCard = cardProbabilities.reduce((max, current) =>
        current.probability > max.probability ? current : max
      );

      return {
        playerId: player.id,
        cardProbabilities: cardProbabilities.filter(
          (v) => v.probability === mostProbableCard.probability
        ),
        mostProbableCard,
      };
    });
}

function calculateBaronProbabilities(
  players: PlayerWithRemainingCards[],
  playerCardValue: number
) {
  return players.map((player) => {
    const totalCards = player.remainingCards.length;
    const superiorCards = player.remainingCards.filter(
      (card) => card.value > playerCardValue
    ).length;
    const probability = totalCards > 0 ? superiorCards / totalCards : 0;

    return {
      playerId: player.id,
      probability,
      superiorCards,
      totalCards,
    };
  });
}

function getBestBaronTarget(
  probabilities: {
    playerId: number;
    probability: number;
    superiorCards: number;
    totalCards: number;
  }[]
) {
  const minProbability = Math.min(...probabilities.map((p) => p.probability));
  const bestTargets = probabilities.filter(
    (p) => p.probability === minProbability
  );

  return getRandomValue(bestTargets)?.playerId;
}

function getPotentialCards(game: GameType, player: PlayerType) {
  const remainingCards = getRemainingCards(game, player);
  const players: PlayerWithRemainingCards[] = getValidTargets(game, player).map(
    (player) => ({
      id: player.id,
      remainingCards: [...remainingCards],
      priority: 0,
    })
  );
  const histories = getHistoriesUntilEndOfRound(game.histories);
  histories.shift();
  let isLastTurn = true;
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    filterSeenCardPotentialCards({
      game,
      players,
      player,
      history,
      historyIndex: i,
    });
    filterCountessPotentialCards({
      game,
      players,
      history,
      historyIndex: i,
    });
    filterBaronEqualityPotentialCards({
      game,
      players,
      history,
      player,
      historyIndex: i,
    });
    filterKingPotentialCards({
      game,
      players,
      history,
      player,
      historyIndex: i,
    });
    isLastTurn = history.playerId !== player.id;
    if (isLastTurn) {
      filterBaronPotentialCards({
        players,
        history,
      });
    }
  }

  return players;
}

function filterSeenCardPotentialCards({
  game,
  players,
  player,
  history,
  historyIndex,
}: {
  players: PlayerWithRemainingCards[];
  history: GameHistoryType;
  historyIndex: number;
  player: PlayerType;
  game: GameType;
}) {
  if (history.effect?.seeCard !== undefined && history.playerId === player.id) {
    const seenCard = history.effect.seeCard;
    const player = players.find(
      (player) => player.id === history.effect?.targetPlayerId
    );
    if (
      player &&
      !hasPlayedCardSinceHistories(game, historyIndex, player.id, seenCard)
    ) {
      player.remainingCards = player.remainingCards.filter(
        (card) => card.value === seenCard
      );
      player.priority = 5;
    }
  }
}

function filterBaronEqualityPotentialCards({
  game,
  players,
  history,
  player,
  historyIndex,
}: {
  game: GameType;
  players: PlayerWithRemainingCards[];
  history: GameHistoryType;
  player: PlayerType;
  historyIndex: number;
}) {
  if (
    history.effect?.name === 'baron' &&
    history.effect.baronEqualityCardValue !== undefined &&
    (player.id === history.playerId ||
      player.id === history.effect.targetPlayerId)
  ) {
    const cardValue = history.effect.baronEqualityCardValue;
    const otherPlayer = players.find(
      (p) =>
        p.id ===
        (player.id === history.playerId
          ? history.effect?.targetPlayerId
          : history.playerId)
    );
    if (
      cardValue &&
      otherPlayer &&
      !hasPlayedCardSinceHistories(game, historyIndex, player.id, cardValue)
    ) {
      otherPlayer.remainingCards = otherPlayer.remainingCards.filter(
        (c) => c.value === cardValue
      );
    }
  }
}

function filterKingPotentialCards({
  game,
  players,
  history,
  player,
  historyIndex,
}: {
  game: GameType;
  players: PlayerWithRemainingCards[];
  history: GameHistoryType;
  player: PlayerType;
  historyIndex: number;
}) {
  if (
    history.effect?.name === 'king' &&
    (player.id === history.playerId ||
      player.id === history.effect.targetPlayerId)
  ) {
    const cardValue =
      player.id === history.playerId
        ? history.effect.playerSwapCard
        : history.effect.targetPlayerSwapCard;
    const otherPlayer = players.find(
      (p) =>
        p.id ===
        (player.id === history.playerId
          ? history.effect?.targetPlayerId
          : history.playerId)
    );
    if (
      cardValue &&
      otherPlayer &&
      !hasPlayedCardSinceHistories(game, historyIndex, player.id, cardValue)
    ) {
      otherPlayer.remainingCards = otherPlayer.remainingCards.filter(
        (c) => c.value === cardValue
      );
    }
  }
}

function filterBaronPotentialCards({
  players,
  history,
}: {
  players: PlayerWithRemainingCards[];
  history: GameHistoryType;
}) {
  if (
    history.effect?.name === 'baron' &&
    history.effect.potentialCardValues !== undefined
  ) {
    const potentialCardValues = history.effect.potentialCardValues;
    const player1 = players.find((p) => p.id === history.playerId);
    const player2 = players.find(
      (p) => p.id === history.effect?.targetPlayerId
    );
    if (player1) {
      player1.remainingCards = player1.remainingCards.filter((c) =>
        potentialCardValues.includes(c.value)
      );
    }
    if (player2) {
      player2.remainingCards = player2.remainingCards.filter((c) =>
        potentialCardValues.includes(c.value)
      );
    }
  }
}

function filterCountessPotentialCards({
  game,
  players,
  history,
  historyIndex,
}: {
  players: PlayerWithRemainingCards[];
  history: GameHistoryType;
  historyIndex: number;
  game: GameType;
}) {
  if (history.cardPlayed?.value === 8) {
    const player = players.find((player) => player.id === history.playerId);
    if (player && player.priority < 4) {
      const hasPlayedPrince = hasPlayedCardSinceHistories(
        game,
        historyIndex,
        player.id,
        5
      );
      const hasPlayedKing = hasPlayedCardSinceHistories(
        game,
        historyIndex,
        player.id,
        7
      );
      if (!hasPlayedKing && !hasPlayedPrince) {
        player.remainingCards = player.remainingCards.filter((card) =>
          [5, 7, 9].includes(card.value)
        );
        player.priority = 4;
      }
    }
  }
}

function hasBestCardInDeck(game: GameType, player: PlayerType, card: CardType) {
  const remainingCards = getRemainingCards(game, player);
  return remainingCards.some(
    (remainingCard) => remainingCard.value > card.value
  );
}

export function getRoundStage(game: GameType): 'early' | 'mid' | 'late' {
  const activePlayers = game.players.filter((player) => !player.isEliminated);
  const totalPlayers = game.players.length;
  const remainingCards = game.deck.length;

  if (
    remainingCards > 2 * activePlayers.length &&
    activePlayers.length >= 0.75 * totalPlayers
  ) {
    return 'early';
  }

  if (remainingCards <= activePlayers.length || activePlayers.length <= 3) {
    return 'late';
  }

  return 'mid';
}

export function getGameStatus(
  game: GameType,
  playerId: number
): 'early' | 'mid' | 'late' | 'critical' {
  const activePlayers = game.players.filter(
    (p) => !p.isEliminated && p.id !== playerId
  );
  const remainingCards = game.deck.length;

  const maxScoreToWin = getPointsRequiredForWin(game.players.length);

  const highestScore = Math.max(...activePlayers.map((player) => player.score));

  if (highestScore === 0) {
    return 'early';
  }

  if (highestScore < maxScoreToWin - 2) {
    return 'mid';
  }

  const adjustedScores = activePlayers.map((player) => {
    const baseScore = player.score;
    const hasSpy = player.cardsPlayed.some((card) => card.name === 'spy');
    const spyBonus =
      hasSpy &&
      activePlayers.filter((p) => p.cardsPlayed.some((c) => c.name === 'spy'))
        .length === 1
        ? 1
        : 0;
    return baseScore + spyBonus;
  });

  const adjustedHighestScore = Math.max(...adjustedScores);

  if (adjustedHighestScore === maxScoreToWin - 1) {
    return 'critical';
  }

  if (activePlayers.length <= 3) {
    const isTwoPointsWithSpy = adjustedScores.some(
      (score) => score === maxScoreToWin - 2
    );
    if (isTwoPointsWithSpy && remainingCards < 2 * activePlayers.length) {
      return 'critical';
    }
    if (remainingCards < 2 * activePlayers.length) {
      return 'critical';
    }
  }

  if (
    adjustedHighestScore === maxScoreToWin - 1 ||
    remainingCards >= 2 * activePlayers.length
  ) {
    return 'late';
  }

  return 'mid';
}

const getTopPlayerToTarget = (game: GameType, player: PlayerType) => {
  const eligiblePlayers = game.players.filter(
    (p) => !p.isEliminated && !p.isProtected && p.id !== player.id
  );
  const scores = eligiblePlayers.map((p) => p.score);
  const maxScore = Math.max(...scores);
  const playersWithMaxScore = eligiblePlayers.filter(
    (p) => p.score === maxScore
  );
  const playerWithSpy = playersWithMaxScore.filter((p) =>
    p.cardsPlayed.some((c) => c.name === 'spy')
  );
  return getRandomValue(
    playerWithSpy.length ? playerWithSpy : playersWithMaxScore
  );
};

const getBottomPlayerToTarget = (game: GameType, player: PlayerType) => {
  const eligiblePlayers = game.players.filter(
    (p) => !p.isEliminated && !p.isProtected && p.id !== player.id
  );
  const scores = eligiblePlayers.map((p) => p.score);
  const minScore = Math.min(...scores);
  const playersWithMinScore = eligiblePlayers.filter(
    (p) => p.score === minScore
  );
  const playerWithoutSpy = playersWithMinScore.filter((p) =>
    p.cardsPlayed.some((c) => c.name !== 'spy')
  );
  return getRandomValue(
    playerWithoutSpy.length ? playerWithoutSpy : playersWithMinScore
  );
};

function handleContextualLogic(
  card1: PlayerType['hand'][number],
  card2: PlayerType['hand'][number],
  game: GameType,
  player: PlayerType
): BotCardResponse | null {
  const discardCard = shouldDiscardCard(game, player);
  if (discardCard) {
    return { card: discardCard };
  }

  const response = handleTargetCard(card1, card2, game, player);
  if (response) {
    return response;
  }

  return null;
}

function handleTargetCard(
  card1: PlayerType['hand'][number],
  card2: PlayerType['hand'][number],
  game: GameType,
  player: PlayerType
): BotCardResponse | null {
  const cardsToHandle = ['guard', 'baron', 'prince'];
  for (const card of [card1, card2]) {
    if (cardsToHandle.includes(card.name)) {
      const response = processTargetCardEffect(
        card,
        card === card1 ? card2 : card1,
        game,
        player
      );
      if (response) {
        return response;
      }
    }
  }
  return null;
}

function processTargetCardEffect(
  activeCard: PlayerType['hand'][number],
  otherCard: PlayerType['hand'][number],
  game: GameType,
  player: PlayerType
): BotCardResponse | null {
  const possibleTargetActions = getPossibleTarget(game, player);
  if (!possibleTargetActions) return null;

  switch (activeCard.name) {
    case 'guard':
      return handleGuardTarget(activeCard, possibleTargetActions);

    case 'baron':
      return handleBaronTarget(activeCard, otherCard, possibleTargetActions);

    case 'prince':
      return handlePrinceTarget(activeCard, possibleTargetActions);

    default:
      return null;
  }
}

function handleGuardTarget(
  guardCard: PlayerType['hand'][number],
  possibleTargetActions: PossibleTargetActions
): BotCardResponse | null {
  const possiblesTargetGuardActions = getPossiblesTargetGuardActions(
    possibleTargetActions
  );
  const data = determineTargetForGuard(possiblesTargetGuardActions);
  if (data) {
    return {
      card: guardCard,
      effect: { playerId: data.playerId, value: data.value },
    };
  }
  return null;
}

function handleBaronTarget(
  baronCard: PlayerType['hand'][number],
  otherCard: PlayerType['hand'][number],
  possibleTargetActions: PossibleTargetActions
): BotCardResponse | null {
  const data = determineTargetForBaron(possibleTargetActions, otherCard.value);
  if (data) {
    return {
      card: baronCard,
      effect: { playerId: data.playerId },
    };
  }
  return null;
}

function handlePrinceTarget(
  princeCard: PlayerType['hand'][number],
  possibleTargetActions: PossibleTargetActions
): BotCardResponse | null {
  const data = determineTargetForPrince(possibleTargetActions);
  if (data) {
    return {
      card: princeCard,
      effect: { playerId: data.playerId },
    };
  }
  return null;
}

function getPossiblesTargetGuardActions(
  possibleActions: PossibleTargetActions
): PossibleTargetActions {
  const possiblesGuardActions: PossibleTargetActions = {};

  const hasSeenCard = possibleActions.hasSeenCard;
  if (hasSeenCard && hasSeenCard.value !== 1) {
    possiblesGuardActions.hasSeenCard = hasSeenCard;
  }

  const deducedFromBaronEquality = possibleActions.deducedFromBaronEquality;
  if (deducedFromBaronEquality) {
    if (Array.isArray(deducedFromBaronEquality)) {
      const playersWithPossibleValues = deducedFromBaronEquality
        .map((value) => ({
          player: value.player,
          possibleValues: value.possibleValues?.filter(
            (value) => value !== 1
          ) as CardValue[],
        }))
        .filter(
          ({ possibleValues }) => possibleValues.length > 0
        ) as DeduceFromBaron[];
      if (playersWithPossibleValues.length > 0) {
        possiblesGuardActions.deducedFromBaronEquality =
          playersWithPossibleValues;
      }
    } else if (deducedFromBaronEquality.possibleValues[0] !== 1) {
      possiblesGuardActions.deducedFromBaronEquality = deducedFromBaronEquality;
    }
  }

  const deducedFromKingExchange = possibleActions.deducedFromKingExchange;
  if (deducedFromKingExchange && deducedFromKingExchange.value !== 1) {
    possiblesGuardActions.deducedFromKingExchange = deducedFromKingExchange;
  }

  const deducedFromBaronWinner = possibleActions.deducedFromBaronWinner;
  if (deducedFromBaronWinner) {
    const possibleValues = deducedFromBaronWinner.possibleValues?.filter(
      (value) => value !== 1
    );
    if (possibleValues && possibleValues.length > 0) {
      possiblesGuardActions.deducedFromBaronWinner = {
        ...deducedFromBaronWinner,
        possibleValues,
      };
    }
  }

  if (possibleActions.deducedFromCountess) {
    possiblesGuardActions.deducedFromCountess =
      possibleActions.deducedFromCountess;
  }

  return possiblesGuardActions;
}

function determineShouldDiscardCard(
  player: PlayerType,
  shouldDiscardCard: ShouldDiscardCard
) {
  const handmaid = player.hand.find((card) => card.value === 4);
  if (handmaid) {
    return handmaid;
  }
  let card: CardType | null | undefined = null;
  if (shouldDiscardCard.value) {
    card = player.hand.find((card) => card.value === shouldDiscardCard.value);
  } else if (shouldDiscardCard.minValue) {
    const minValue = shouldDiscardCard.minValue;
    card = player.hand.find((card) => card.value >= minValue);
  } else if (shouldDiscardCard.countess) {
    card = player.hand.find((card) => card.value === 5 || card.value === 7);
  }
  return card ? card : false;
}

function shouldDiscardCard(game: GameType, player: PlayerType) {
  const discardConditions = [
    () => {
      const discardSeenCard = shouldDiscardSeenCard(player, game);
      return discardSeenCard ? { value: discardSeenCard } : false;
    },
    () => {
      const discardKingExchange = shouldDiscardCardAfterKingExchange(
        player,
        game
      );
      return discardKingExchange ? { value: discardKingExchange.value } : false;
    },
    () => {
      const discardBaronEquality = shouldDiscardAfterBaronEquality(
        player,
        game
      );
      return discardBaronEquality ? { value: discardBaronEquality } : false;
    },
    () => {
      const discardBaronWinner = shouldDiscardAfterBaronWinner(player, game);
      return discardBaronWinner ? { value: discardBaronWinner } : false;
    },
    () => {
      const discardCountess = shouldDiscardAfterPlayCountess(player, game);
      return discardCountess ? { countess: true } : false;
    },
  ];

  for (const condition of discardConditions) {
    const shouldDiscardCard = condition();
    if (shouldDiscardCard) {
      return determineShouldDiscardCard(player, shouldDiscardCard);
    }
  }
  return false;
}

function getHistoriesUntilEndOfRound(
  histories: GameHistoryType[]
): GameHistoryType[] {
  const result = [];

  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];

    if (history.endOfRound) {
      break;
    }

    result.push(history);
  }

  return result.reverse();
}

export function shouldDiscardSeenCard(player: PlayerType, game: GameType) {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];

    const seenCard = history.effect?.seeCard;
    const targetPlayerId = history.effect?.targetPlayerId;

    if (seenCard === undefined || targetPlayerId !== player.id) {
      continue;
    }

    const cardInHand = player.hand.some(
      (handCard) => handCard.value === seenCard
    );
    if (seenCard === 3) {
      const otherCard = player.hand.find((card) => card.value !== 3);
      if (otherCard && otherCard.value <= 2) return false;
    }
    if (cardInHand) {
      return seenCard as CardValue;
    }
  }
  return false;
}

export function shouldDiscardCardAfterKingExchange(
  player: PlayerType,
  game: GameType
) {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];

    if (
      history.effect?.name === 'king' &&
      (history.effect.targetPlayerId === player.id ||
        history.playerId === player.id)
    ) {
      const isPlayerInitiator = history.playerId === player.id;
      const opponentId = isPlayerInitiator
        ? history.effect.targetPlayerId
        : history.playerId;

      const swappedCard = isPlayerInitiator
        ? history.effect.targetPlayerSwapCard
        : history.effect.playerSwapCard;

      const opponent = game.players.find((p) => p.id === opponentId);

      if (opponent && !opponent.isEliminated) {
        return player.hand.some((handCard) => handCard.value === swappedCard)
          ? { opponent, value: swappedCard as CardValue }
          : false;
      }
    }
  }

  return false;
}

export function shouldDiscardAfterBaronEquality(
  player: PlayerType,
  game: GameType
) {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (
      history.effect?.name === 'baron' &&
      !history.effect.eliminatedPlayerId
    ) {
      const player1Id = history.playerId;
      const player2Id = history.effect.targetPlayerId;

      if (player.id !== player1Id && player.id !== player2Id) {
        continue;
      }

      const deducedCardValue = history.effect.baronEqualityCardValue;
      if (player.hand.some((handCard) => handCard.value === deducedCardValue)) {
        return deducedCardValue;
      }
    }
  }

  return false;
}

export function shouldDiscardAfterBaronWinner(
  player: PlayerType,
  game: GameType
) {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (
      history.effect?.name !== 'baron' &&
      history.effect?.eliminatedPlayerId === undefined
    ) {
      continue;
    }
    const player1Id = history.playerId;
    const player2Id = history.effect.targetPlayerId;
    if (player.id === player1Id || player.id === player2Id) {
      const loserCardValue = history.effect.eliminatedCardValue as CardValue;
      const cards = player.hand.filter(
        (handCard) => handCard.value > loserCardValue
      );
      if (cards.length === 1) {
        return cards[0].value as CardValue;
      }
    }
  }
  return false;
}

export function shouldDiscardAfterPlayCountess(
  player: PlayerType,
  game: GameType
) {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (history.playerId !== player.id || history.cardPlayed?.value !== 8) {
      continue;
    }
    const roundStage = getRoundStage(game);
    return (
      (history.cardRemaining?.value === 5 ||
        (roundStage === 'late' && history.cardRemaining?.value === 7)) &&
      player.hand.some(
        (handCard) => handCard.value === history.cardRemaining?.value
      )
    );
  }
  return false;
}

function determineTargetForGuard(possibleTargetActions: PossibleTargetActions) {
  if (possibleTargetActions.hasSeenCard) {
    const { playerId, value } = possibleTargetActions.hasSeenCard;
    return {
      playerId,
      value,
    };
  }

  if (possibleTargetActions.deducedFromBaronEquality) {
    const deducedInfo = getDeducedFromBaronEquality(
      possibleTargetActions.deducedFromBaronEquality
    );
    return {
      playerId: deducedInfo.player.id,
      value: getRandomValue(deducedInfo.possibleValues),
    };
  }

  if (possibleTargetActions.deducedFromKingExchange) {
    const { playerId, value } = possibleTargetActions.deducedFromKingExchange;
    return {
      playerId,
      value,
    };
  }

  if (possibleTargetActions.deducedFromBaronWinner) {
    const baronWinnerInfo = possibleTargetActions.deducedFromBaronWinner;
    return {
      playerId: baronWinnerInfo.player.id,
      value: getRandomValue(baronWinnerInfo.possibleValues as CardValue[]),
    };
  }

  if (possibleTargetActions.deducedFromCountess) {
    const { playerId, value } = possibleTargetActions.deducedFromCountess;
    return {
      playerId,
      value,
    };
  }

  return null;
}

function determineTargetForBaron(
  possibleTargetActions: PossibleTargetActions,
  cardValue: CardValue
) {
  if (possibleTargetActions.hasSeenCard) {
    const { playerId, value } = possibleTargetActions.hasSeenCard;
    if (value < cardValue) {
      return {
        playerId,
      };
    }
  }

  if (possibleTargetActions.deducedFromBaronEquality) {
    const deducedInfo = getDeducedFromBaronEquality(
      possibleTargetActions.deducedFromBaronEquality
    );
    const maxValue = Math.max(...deducedInfo.possibleValues);
    if (maxValue < cardValue) {
      return {
        playerId: deducedInfo.player.id,
      };
    }
  }

  if (possibleTargetActions.deducedFromKingExchange) {
    const { playerId, value } = possibleTargetActions.deducedFromKingExchange;
    if (value < cardValue) {
      return {
        playerId,
      };
    }
  }

  if (possibleTargetActions.deducedFromBaronWinner) {
    const baronWinnerInfo = possibleTargetActions.deducedFromBaronWinner;
    const maxValue = Math.max(...baronWinnerInfo.possibleValues);
    if (maxValue < cardValue) {
      return {
        playerId: baronWinnerInfo.player.id,
      };
    }
  }

  if (possibleTargetActions.deducedFromCountess) {
    const { playerId, value } = possibleTargetActions.deducedFromCountess;
    if (value < cardValue) {
      return {
        playerId,
      };
    }
  }

  return null;
}

function determineTargetForPrince(
  possibleTargetActions: PossibleTargetActions
) {
  if (possibleTargetActions.hasSeenCard) {
    const { playerId, value } = possibleTargetActions.hasSeenCard;
    if (value === 9) {
      return {
        playerId,
      };
    }
  }

  if (possibleTargetActions.deducedFromKingExchange) {
    const { playerId, value } = possibleTargetActions.deducedFromKingExchange;
    if (value === 9) {
      return {
        playerId,
      };
    }
  }

  if (possibleTargetActions.deducedFromBaronWinner) {
    const baronWinnerInfo = possibleTargetActions.deducedFromBaronWinner;
    const maxValue = Math.max(...baronWinnerInfo.possibleValues);
    if (maxValue === 9) {
      return {
        playerId: baronWinnerInfo.player.id,
      };
    }
  }

  if (possibleTargetActions.deducedFromCountess) {
    const { playerId, value } = possibleTargetActions.deducedFromCountess;
    if (value === 9) {
      return {
        playerId,
      };
    }
  }

  return null;
}

function getDeducedFromBaronEquality(
  deducedFromBaronEquality: DeduceFromBaron | DeduceFromBaron[]
) {
  let value: DeduceFromBaron;
  if (Array.isArray(deducedFromBaronEquality)) {
    if (deducedFromBaronEquality.length === 1) {
      value = deducedFromBaronEquality[0];
    } else {
      const bestPlayer = getBestPlayerScore(
        deducedFromBaronEquality.map((value) => value.player)
      );
      if (bestPlayer) {
        value = deducedFromBaronEquality.find(
          (value) => value.player.id === bestPlayer.id
        ) as DeduceFromBaron;
      } else if (
        deducedFromBaronEquality[0].possibleValues &&
        deducedFromBaronEquality[1].possibleValues &&
        deducedFromBaronEquality[0].possibleValues.length >
          deducedFromBaronEquality[1].possibleValues.length
      ) {
        value = deducedFromBaronEquality[0];
      } else {
        value = getRandomValue(deducedFromBaronEquality);
      }
    }
    return value;
  }
  return deducedFromBaronEquality;
}

function getBestPlayerScore(players: PlayerType[]) {
  const maxScore = Math.max(...players.map((player) => player.score));
  const topPlayers = players.filter((player) => player.score === maxScore);
  if (topPlayers.length === 1) {
    return topPlayers[0];
  }
  return null;
}

function getPossibleTarget(game: GameType, player: PlayerType) {
  const possibleTargetActions: PossibleTargetActions = {};
  const validTargets = getValidTargets(game, player);
  if (validTargets.length) {
    const remainingCards = getRemainingCards(game, player);
    const hasSeenCard = hasSeenCardStillInPlay(player, game);
    if (hasSeenCard) {
      possibleTargetActions.hasSeenCard = hasSeenCard;
    }

    const deducedFromBaronEquality = deduceFromBaronEquality(
      game,
      player,
      validTargets
    );
    if (deducedFromBaronEquality) {
      possibleTargetActions.deducedFromBaronEquality = deducedFromBaronEquality;
    }

    const deducedFromKingExchange = deduceFromKingExchange(player, game);
    if (deducedFromKingExchange) {
      possibleTargetActions.deducedFromKingExchange = deducedFromKingExchange;
    }

    const deducedFromBaronWinner = deduceFromBaronWinner(game);
    if (deducedFromBaronWinner) {
      possibleTargetActions.deducedFromBaronWinner = deducedFromBaronWinner;
    }

    const deducedFromCountess = deduceFromCountess(game, remainingCards);
    if (deducedFromCountess) {
      possibleTargetActions.deducedFromCountess = deducedFromCountess;
    }
  }
  return Object.values(possibleTargetActions).length > 0
    ? possibleTargetActions
    : null;
}

export function hasSeenCardStillInPlay(
  player: PlayerType,
  game: GameType
): DeducedCard | null {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (
      history.effect?.seeCard !== undefined &&
      history.playerId === player.id
    ) {
      const targetId = history.effect.targetPlayerId as number;
      const target = game.players.find((p) => p.id === targetId);
      if (!playerMayBeTargeted(target)) {
        continue;
      }
      const cardSeen = history.effect.seeCard;
      const isCardPlayed = hasPlayedCardSinceHistories(
        game,
        i,
        targetId,
        cardSeen
      );
      if (!isCardPlayed) {
        return { playerId: targetId, value: cardSeen };
      }
    }
  }
  return null;
}

export function deduceFromBaronWinner(game: GameType): DeduceFromBaron | null {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (
      history.effect?.name === 'baron' &&
      history.effect.eliminatedPlayerId !== undefined
    ) {
      const loserCardValue = history.effect.eliminatedCardValue as CardValue;
      const target = game.players.find(
        (p) => p.id === history.playerId
      ) as PlayerType;
      if (!playerMayBeTargeted(target)) {
        continue;
      }
      const possibleValues = history.effect.potentialCardValues?.filter(
        (value) =>
          value > loserCardValue &&
          !hasPlayedCardSinceHistories(game, i, target.id, value)
      ) as CardValue[];
      if (possibleValues.length > 0) {
        return { player: target, possibleValues };
      }
    }
  }
  return null;
}

export function deduceFromBaronEquality(
  game: GameType,
  player: PlayerType,
  players: PlayerType[]
): DeduceFromBaron | DeduceFromBaron[] | null {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (
      history.effect?.name === 'baron' &&
      history.effect.eliminatedPlayerId !== undefined
    ) {
      const player1 = game.players.find(
        (p) => p.id === history.playerId
      ) as PlayerType;
      const player2 = game.players.find(
        (p) => p.id === history.effect?.targetPlayerId
      ) as PlayerType;

      if (player.id === player1.id || player.id === player2.id) {
        const targetedPlayer = players.find(
          (p) => p.id === (player.id === player1.id ? player2.id : player1.id)
        );
        const cardValue = history.effect.baronEqualityCardValue as CardValue;
        if (targetedPlayer) {
          const hasPlayedCard = hasPlayedCardSinceHistories(
            game,
            i,
            targetedPlayer.id,
            cardValue
          );
          if (targetedPlayer && !hasPlayedCard) {
            return { player: targetedPlayer, possibleValues: [cardValue] };
          }
        }
      } else {
        const possibleValues = history.effect
          ?.potentialCardValues as CardValue[];

        const playersWithPossibleValues = [player1, player2].map((player) => {
          const playerPossibleValues = possibleValues.filter(
            (value) => !hasPlayedCardSinceHistories(game, i, player.id, value)
          );
          return { player, possibleValues: playerPossibleValues };
        });

        const validPlayers = playersWithPossibleValues.filter(
          ({ possibleValues }) =>
            possibleValues.length > 0 && players.find((v) => v.id === player.id)
        );

        if (validPlayers.length > 0) {
          return validPlayers.map(({ player, possibleValues }) => ({
            player,
            possibleValues,
          }));
        }
      }
    }
  }
  return null;
}

export function deduceFromCountess(
  game: GameType,
  remainingCards: CardType[]
): DeducedCard | null {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];
    if (history.cardPlayed?.value !== 8) {
      continue;
    }

    const kingIsRemaining = remainingCards.some((card) => card.value === 7);
    const princesRemaining = remainingCards.filter(
      (card) => card.value === 5
    ).length;

    const playerId = history.playerId as number;

    if (
      !kingIsRemaining &&
      (princesRemaining === 0 ||
        hasPlayedCardSinceHistories(game, i, playerId, 5))
    ) {
      return null;
    }

    return {
      playerId,
      value: kingIsRemaining ? 7 : 5,
    };
  }

  return null;
}

export function deduceFromKingExchange(
  player: PlayerType,
  game: GameType
): DeducedCard | null {
  const histories = getHistoriesUntilEndOfRound(game.histories);
  for (let i = histories.length - 1; i >= 0; i--) {
    const history = histories[i];

    if (
      history.effect?.name === 'king' &&
      history.effect.targetPlayerId === player.id
    ) {
      const targetId = history.playerId as number;
      const swappedCard = history.effect.targetPlayerSwapCard;
      if (
        swappedCard !== undefined &&
        !hasPlayedCardSinceHistories(game, i, targetId, swappedCard)
      ) {
        return {
          playerId: targetId,
          value: swappedCard,
        };
      }
    } else if (
      history.effect?.name === 'king' &&
      history.playerId === player.id
    ) {
      const targetId = history.effect.targetPlayerId as number;
      const swappedCard = history.effect.playerSwapCard;
      if (
        swappedCard !== undefined &&
        !hasPlayedCardSinceHistories(game, i, targetId, swappedCard)
      ) {
        return {
          playerId: targetId,
          value: swappedCard,
        };
      }
    }
  }

  return null;
}

function playerMayBeTargeted(player?: PlayerType) {
  return player && !player.isProtected && !player.isEliminated;
}

function getRandomValue<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)] as T;
}
function findMaxPossibleCards(cards: CardType[]): CardType[] {
  const cardCount = new Map<string, number>();
  cards.forEach((card) => {
    cardCount.set(card.name, (cardCount.get(card.name) || 0) + 1);
  });
  const maxCount = Math.max(...Array.from(cardCount.values()));
  return cards.filter((card) => cardCount.get(card.name) === maxCount);
}

function getRemainingCards(game: GameType, player: PlayerType): CardType[] {
  const fullDeck = getDeck();
  const knownCards = getCardsPlayedIncludingHands(game, player);
  knownCards.forEach((card) => {
    const index = fullDeck.findIndex(
      (deckCard) => deckCard.name === card.name && deckCard.value === card.value
    );
    if (index !== -1) {
      fullDeck.splice(index, 1);
    }
  });
  return fullDeck;
}

function getCardsPlayedIncludingHands(
  game: GameType,
  player: PlayerType
): CardType[] {
  const cardsPlayed = getCardsPlayed(game);
  return [...cardsPlayed, ...player.hand];
}

function getCardsPlayed(game: GameType) {
  return game?.players.flatMap((player) => player.cardsPlayed);
}

function hasPlayedCardSinceHistories(
  game: GameType,
  i: number,
  playerId: number,
  cardValue: number
) {
  return game.histories
    .slice(i + 1)
    .some((h) => h.playerId === playerId && h.cardPlayed?.value === cardValue);
}

function getValidTargets(game: GameType, player: PlayerType) {
  return game.players.filter(
    (p) => p.id !== player.id && !p.isEliminated && !p.isProtected
  );
}
