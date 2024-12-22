import spy from '../../assets/cards/spy.png';
import guard from '../../assets/cards/guard.png';
import priest from '../../assets/cards/priest.png';
import baron from '../../assets/cards/baron.png';
import handmaid from '../../assets/cards/handmaid.png';
import prince from '../../assets/cards/prince.png';
import chancellor from '../../assets/cards/chancellor.png';
import king from '../../assets/cards/king.png';
import countess from '../../assets/cards/countess.png';
import princess from '../../assets/cards/princess.png';

export function getCardImage(value: number) {
  switch (value) {
    case 0:
      return spy;
    case 1:
      return guard;
    case 2:
      return priest;
    case 3:
      return baron;
    case 4:
      return handmaid;
    case 5:
      return prince;
    case 6:
      return chancellor;
    case 7:
      return king;
    case 8:
      return countess;
    case 9:
      return princess;
  }
}
