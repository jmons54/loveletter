const names = [
  'Aerith',
  'Bryn',
  'Caelum',
  'Dain',
  'Erya',
  'Fael',
  'Gael',
  'Hylia',
  'Isen',
  'Jorah',
  'Kaelen',
  'Liora',
  'Mira',
  'Nerys',
  'Orin',
  'Pyria',
  'Quen',
  'Ryn',
  'Selar',
  'Talen',
  'Uria',
  'Veyra',
  'Wyn',
  'Xyra',
  'Ylric',
  'Zareth',
  'Alaric',
  'Brivan',
  'Ceryn',
  'Draven',
  'Eryndor',
  'Feyra',
  'Grim',
  'Havok',
  'Iliana',
  'Jalen',
  'Krynn',
  'Lorien',
  'Myra',
  'Nyssa',
  'Oryn',
  'Pyrrin',
  'Quorra',
  'Ryker',
  'Sorin',
  'Tirian',
  'Vael',
  'Wrenna',
  'Xanor',
  'Zylen',
];

export function generateName(): string {
  const adjectives = [
    'Brave',
    'Wise',
    'Noble',
    'Swift',
    'Fierce',
    'Mystic',
    'Shadow',
    'Silent',
    'Valiant',
  ];

  const card = names[Math.floor(Math.random() * names.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNumber = Math.floor(Math.random() * 100);

  return `${card}${adjective}${randomNumber ?? ''}`;
}

export function generateShortName() {
  const card = names[Math.floor(Math.random() * names.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  return `${card}${randomNumber ?? ''}`;
}
