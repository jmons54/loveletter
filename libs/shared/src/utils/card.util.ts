import type { CardType } from '../types/card.type';
import type { GameType } from '../types/game.type';

interface CardWithQuantity extends Omit<CardType, 'id'> {
  quantity: number;
}

export const cards: CardWithQuantity[] = [
  { name: 'spy', value: 0, quantity: 2 },
  { name: 'guard', value: 1, quantity: 6 },
  { name: 'priest', value: 2, quantity: 2 },
  { name: 'baron', value: 3, quantity: 2 },
  { name: 'handmaid', value: 4, quantity: 2 },
  { name: 'prince', value: 5, quantity: 2 },
  { name: 'chancellor', value: 6, quantity: 2 },
  { name: 'king', value: 7, quantity: 1 },
  { name: 'countess', value: 8, quantity: 1 },
  { name: 'princess', value: 9, quantity: 1 },
];

export function getDeck() {
  const deck: CardType[] = [];
  [...cards].forEach((card) => {
    for (let i = 0; i < card.quantity; i++) {
      deck.push({
        id: `card-${card.value}-${i}`,
        name: card.name,
        value: card.value,
      });
    }
  });
  return deck;
}

export function getShuffleDeck() {
  const deck = getDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function getRemainingCards(game: GameType): CardType[] {
  const fullDeck = getDeck();
  const knownCards = getCardsPlayed(game);
  knownCards?.forEach((card) => {
    const index = fullDeck.findIndex(
      (deckCard) => deckCard.name === card.name && deckCard.value === card.value
    );
    if (index !== -1) {
      fullDeck.splice(index, 1);
    }
  });
  return fullDeck;
}

export function getCardsPlayed(game?: GameType | null) {
  return game?.players.flatMap((player) => player.cardsPlayed);
}
