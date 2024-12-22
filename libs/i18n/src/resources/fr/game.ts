export default {
  welcomeToLoveLetter: 'Bienvenue dans Love Letter',
  startToPlay: 'Commencer à jouer',
  settings: 'Paramètres',
  gameParameters: 'Paramètres de jeu',
  chooseYourAvatar: 'Choisissez votre avatar',
  chooseUserName: 'Choisissez un nom',
  enterYourName: 'Entrez votre nom',
  showTooltips: 'Afficher laide',
  nextRound: 'Prochain tour',
  newGame: 'Nouvelle partie',
  numberOfPlayers: 'Nombre de joueurs',
  startNewGame: 'Démarrer une nouvelle partie',
  language: 'Langue',
  soundsEffects: 'Effets sonores',
  music: 'Musique',
  toggleSound: 'Activer/Désactiver le son',
  toggleMusic: 'Activer/Désactiver la musique',
  autoPlay: 'Jeu automatique',
  playerStart: 'Je commence !',
  targetEffect: 'Je choisis {{name}}',
  roundWinner: 'Je gagne et je marque 1 point !',
  roundWinnerSpy: 'Je gagne et je marque 2 points !',
  roundSpy: "Je marque 1 point avec l'espionne !",
  applyEffectGuard: '{{name}} a {{card}}',
  applyEffectPriest: 'Je regarde la carte de {{name}}',
  applyEffectBaron: 'Je défie {{name}}',
  applyEffectBaronEquality: 'Nous avons la même carte',
  applyEffectHandmaid: 'Je suis protégé pendant un tour',
  applyEffectPrince: '{{name}} défausse sa carte',
  applyEffectChancellor_one: 'Je pioche {{count}} carte',
  applyEffectChancellor_other: 'Je pioche {{count}} cartes',
  applyEffectKing: "J'échange ma carte avec {{name}}",
  applyEffectCountess: 'Vous pensez que je bluffe ?',
  applyEffectEliminated: "J'ai perdu !",
  applyEffectGuardError: "Je n'ai pas {{- card}}",
  cards: {
    spy: 'une espionne',
    guard: 'un garde',
    priest: 'un prêtre',
    baron: 'un baron',
    handmaid: 'une servante',
    prince: 'un prince',
    chancellor: 'un chancelier',
    king: 'le roi',
    countess: 'la comtesse',
    princess: 'la princesse',
  },
  cardsOf: {
    spy: "d'espionne",
    guard: 'de garde',
    priest: 'de prêtre',
    baron: 'de baron',
    handmaid: 'de servante',
    prince: 'de prince',
    chancellor: 'de chancelier',
    king: 'le roi',
    countess: 'la comtesse',
    princess: 'la princesse',
  },
  rulesOfGame: 'Règles du jeu',
  cardsEffect: {
    princess: {
      name: 'Princesse',
      value: 9,
      number: 1,
      description:
        'Si vous jouez ou défaussez la Princesse, quelque soit la raison, vous quittez la manche.',
    },
    countess: {
      name: 'Comtesse',
      value: 8,
      number: 1,
      description:
        'Si l’autre carte de votre main est le Roi ou un Prince, vous devez jouer la Comtesse pendant votre tour.',
    },
    king: {
      name: 'Roi',
      value: 7,
      number: 1,
      description:
        'Choisissez un autre joueur et échangez votre main contre la sienne.',
    },
    chancellor: {
      name: 'Chancelier',
      value: 6,
      number: 2,
      description:
        'Vous piochez deux cartes puis vous en gardez une, cliquez sur les cartes pour les placer sous la pioche. La dernière cliqué sera sous le paquet.',
    },
    prince: {
      name: 'Prince',
      value: 5,
      number: 2,
      description:
        'Choisissez n’importe quel joueur (y compris vous-même). Le joueur choisi défausse sa main et en pioche une nouvelle.',
    },
    handmaid: {
      name: 'Servante',
      value: 4,
      number: 2,
      description:
        'Jusqu’au début de votre prochain tour, les autres joueurs ne peuvent pas vous cibler lorsqu’ils résolvent leurs effets de cartes.',
    },
    baron: {
      name: 'Baron',
      value: 3,
      number: 2,
      description:
        'Choisissez un autre joueur et comparez vos mains. Celui qui détient la carte dont la valeur est la plus faible quitte la manche.',
    },
    priest: {
      name: 'Prêtre',
      value: 2,
      number: 2,
      description: 'Choisissez un autre joueur et regardez sa main.',
    },
    guard: {
      name: 'Garde',
      value: 1,
      number: 6,
      description:
        'Choisissez un autre joueur et nommez un personnage autre que le Garde. Si le joueur choisi a cette carte en main, il quitte la manche.',
    },
    spy: {
      name: 'Espionne',
      value: 0,
      number: 2,
      description:
        'Si vous êtes le dernier joueur en lice à la fin de la manche et avez joué ou défaussé une Espionne, vous gagnez marquez un point.',
    },
  },
  shortcuts: [
    {
      name: 'Joueur suivant',
      description:
        'Entrée ou Flèche Droite (→) : Passer au joueur suivant (mode autoPlay désactivé)',
    },
    {
      name: 'Jouer la carte de gauche',
      description: 'Flèche Gauche (←) : Jouer la carte située à gauche',
    },
    {
      name: 'Jouer la carte de droite',
      description: 'Flèche Droite (→) : Jouer la carte située à droite',
    },
    {
      name: 'Sélectionner un joueur (Effet)',
      description:
        'Flèche Gauche (←) ou Flèche Droite (→) pour sélectionner un joueur, puis Entrée pour valider',
    },
    {
      name: 'Choisir une carte (Effet Garde)',
      description:
        'Flèche Gauche (←) ou Flèche Droite (→) pour sélectionner une carte, puis Entrée pour valider',
    },
    {
      name: 'Replacer des cartes (Effet Chancelier)',
      description:
        'Flèche Gauche (←) pour replacer la carte de gauche, Flèche Haut (↑) pour replacer la carte du haut, Flèche Droite (→) pour replacer la carte de droite',
    },
    {
      name: 'Fermer une fenêtre',
      description: 'Échap : Fermer une fenêtre (modale)',
    },
    {
      name: "Ouvrir l'aide",
      description: "A : Ouvrir la modal d'aide",
    },
    {
      name: 'Ouvrir les paramètres de jeu',
      description: 'J : Ouvrir la modal des paramètres de jeu',
    },
    {
      name: 'Ouvrir les paramètres utilisateur',
      description: 'U : Ouvrir la modal des paramètres utilisateur',
    },
  ],
  shortcutsTitle: 'Raccourcis clavier',
};
