import avatar1 from '../../assets/avatars/avatar1.png';
import avatar2 from '../../assets/avatars/avatar2.png';
import avatar3 from '../../assets/avatars/avatar3.png';
import avatar4 from '../../assets/avatars/avatar4.png';
import avatar5 from '../../assets/avatars/avatar5.png';
import avatar6 from '../../assets/avatars/avatar6.png';
import avatar7 from '../../assets/avatars/avatar7.png';
import avatar8 from '../../assets/avatars/avatar8.png';
import avatar9 from '../../assets/avatars/avatar9.png';
import avatar10 from '../../assets/avatars/avatar10.png';
import avatar11 from '../../assets/avatars/avatar11.png';
import avatar12 from '../../assets/avatars/avatar12.png';

export function getAvatar(id: number): ImageData {
  switch (id) {
    case 1:
      return avatar1;
    case 2:
      return avatar2;
    case 3:
      return avatar3;
    case 4:
      return avatar4;
    case 5:
      return avatar5;
    case 6:
      return avatar6;
    case 7:
      return avatar7;
    case 8:
      return avatar8;
    case 9:
      return avatar9;
    case 10:
      return avatar10;
    case 11:
      return avatar11;
    default:
      return avatar12;
  }
}

export const getRandomAvatar = (avatars: ImageData[]) => {
  return avatars[Math.floor(Math.random() * avatars.length)];
};

export const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
  avatar11,
  avatar12,
];
