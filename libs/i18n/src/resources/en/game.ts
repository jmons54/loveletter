export default {
  welcomeToLoveLetter: 'Welcome to Love Letter',
  startToPlay: 'Start to play',
  settings: 'Settings',
  gameParameters: 'Game parameters',
  chooseYourAvatar: 'Choose your avatar',
  chooseUserName: 'Choose user name',
  enterYourName: 'Enter your name',
  showTooltips: 'Show tooltips',
  nextRound: 'Next round',
  newGame: 'New game',
  numberOfPlayers: 'Number of players',
  startNewGame: 'Start a new game',
  language: 'Language',
  soundsEffects: 'Sound Effects',
  music: 'Music',
  toggleSound: 'Toggle Sound',
  toggleMusic: 'Toggle Music',
  autoPlay: 'Auto Play',
  playerStart: 'I start!',
  targetEffect: 'I choose {{name}}',
  roundWinner: 'I win and I score 1 point !',
  roundWinnerSpy: 'I win and I score 2 points!',
  roundSpy: 'I score 1 point with the spy!',
  applyEffectGuard: '{{name}} has {{card}}',
  applyEffectPriest: "I look at {{name}}'s card",
  applyEffectBaron: 'I challenge {{name}}',
  applyEffectBaronEquality: 'We have the same card',
  applyEffectHandmaid: 'I am protected for one turn',
  applyEffectPrince: '{{name}} discards their card',
  applyEffectChancellor_one: 'I draw {{count}} card',
  applyEffectChancellor_other: 'I draw {{count}} cards',
  applyEffectKing: 'I exchange my card with {{name}}',
  applyEffectCountess: 'Do you think I am bluffing?',
  applyEffectEliminated: 'I lost!',
  applyEffectGuardError: "I don't have {{card}}",
  modalGuard: {
    title: 'Which card does {{playerName}} have?',
    success: 'Well done! You guessed the card.',
    fail: 'Too bad! You guessed wrong.',
  },
  cards: {
    spy: 'a spy',
    guard: 'a guard',
    priest: 'a priest',
    baron: 'a baron',
    handmaid: 'a handmaid',
    prince: 'a prince',
    chancellor: 'a chancellor',
    king: 'the king',
    countess: 'the countess',
    princess: 'the princess',
  },
  cardsOf: {
    spy: 'a spy',
    guard: 'a guard',
    priest: 'a priest',
    baron: 'a baron',
    handmaid: 'a handmaid',
    prince: 'a prince',
    chancellor: 'a chancellor',
    king: 'the king',
    countess: 'the countess',
    princess: 'the princess',
  },
  rulesOfGame: 'Rules of the Game',
  cardsEffect: {
    princess: {
      name: 'Princess',
      value: 9,
      number: 1,
      description:
        'If you play or discard the Princess for any reason, you immediately lose the round.',
    },
    countess: {
      name: 'Countess',
      value: 8,
      number: 1,
      description:
        'If the other card in your hand is the King or a Prince, you must play the Countess on your turn.',
    },
    king: {
      name: 'King',
      value: 7,
      number: 1,
      description: 'Choose another player and exchange your hand with theirs.',
    },
    chancellor: {
      name: 'Chancellor',
      value: 6,
      number: 2,
      description:
        'Draw two cards, then keep one. Click on the cards to place them at the bottom of the deck. The last one clicked will be at the very bottom.',
    },
    prince: {
      name: 'Prince',
      value: 5,
      number: 2,
      description:
        'Choose any player (including yourself). The chosen player discards their hand and draws a new card.',
    },
    handmaid: {
      name: 'Handmaid',
      value: 4,
      number: 2,
      description:
        'Until the start of your next turn, other players cannot target you with their card effects.',
    },
    baron: {
      name: 'Baron',
      value: 3,
      number: 2,
      description:
        'Choose another player and compare hands. The player with the lower-value card is eliminated from the round.',
    },
    priest: {
      name: 'Priest',
      value: 2,
      number: 2,
      description: 'Choose another player and look at their hand.',
    },
    guard: {
      name: 'Guard',
      value: 1,
      number: 6,
      description:
        'Choose another player and name a character other than the Guard. If the chosen player has that card in their hand, they are eliminated from the round.',
    },
    spy: {
      name: 'Spy',
      value: 0,
      number: 2,
      description:
        'If you are the last player standing at the end of the round and have played or discarded a Spy, you gain a point.',
    },
  },
  shortcuts: [
    {
      name: 'Next player',
      description:
        'Enter or Right Arrow (→): Move to the next player (autoPlay mode disabled)',
    },
    {
      name: 'Play the left card',
      description: 'Left Arrow (←): Play the card on the left',
    },
    {
      name: 'Play the right card',
      description: 'Right Arrow (→): Play the card on the right',
    },
    {
      name: 'Select a player (Effect)',
      description:
        'Left Arrow (←) or Right Arrow (→) to select a player, then Enter to confirm',
    },
    {
      name: 'Choose a card (Guard Effect)',
      description:
        'Left Arrow (←) or Right Arrow (→) to select a card, then Enter to confirm',
    },
    {
      name: 'Place cards back (Chancellor Effect)',
      description:
        'Left Arrow (←) to place the left card back, Up Arrow (↑) to place the middle card back, Right Arrow (→) to place the right card back',
    },
    {
      name: 'Close a window',
      description: 'Escape : Close a window (modal)',
    },
    {
      name: 'Open Help',
      description: 'H : Open Help (modal)',
    },
    {
      name: 'Open Game Settings',
      description: 'G : Open Game Settings (modal)',
    },
    {
      name: 'Open User Settings',
      description: 'U : Open User Settings (modal)',
    },
  ],
  shortcutsTitle: 'Keyboard Shortcuts',
};
