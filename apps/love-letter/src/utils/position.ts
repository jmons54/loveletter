export function calculatePlayerPositions(numPlayers: number) {
  const positions: { top: number; left: number }[] = [];

  const bottom = 90;
  const centerX = 50;
  const centerY = 59;
  const leftX = 15;
  const rightX = 85;
  const topY = 30;

  positions.push({ top: bottom, left: centerX }); // Bas
  if (numPlayers === 2) {
    positions.push({ top: topY, left: centerX }); // Top
  } else if (numPlayers === 3) {
    positions.push({ top: centerY, left: rightX });
    positions.push({ top: topY, left: centerX });
  } else if (numPlayers === 4) {
    positions.push({ top: centerY, left: rightX });
    positions.push({ top: topY, left: centerX });
    positions.push({ top: centerY, left: leftX });
  } else if (numPlayers === 5) {
    positions.push({ top: centerY, left: rightX });
    positions.push({ top: topY, left: 75 });
    positions.push({ top: topY, left: 25 });
    positions.push({ top: centerY, left: leftX });
  } else if (numPlayers === 6) {
    const bottomY1 = 70;
    const bottomY2 = 45;
    positions.push({ top: bottomY1, left: rightX });
    positions.push({ top: bottomY2, left: rightX });
    positions.push({ top: topY, left: centerX });
    positions.push({ top: bottomY2, left: leftX });
    positions.push({ top: bottomY1, left: leftX });
  }

  return positions;
}
