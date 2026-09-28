export function getNextHead(head, dir) {
  return { x: head.x + dir.x, y: head.y + dir.y };
}

export function checkCollision(nextHead, body, gridSize = 20) {
  // 越界
  if (nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize) {
    return true;
  }
  // 自咬
  return body.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);
}

export function generateFood(body, gridSize = 20) {
  const occupied = new Set(body.map((b) => `${b.x},${b.y}`));
  const available = [];

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) return { x: 0, y: 0 };
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

export function isOppositeDirection(dir1, dir2) {
  return dir1.x === -dir2.x && dir1.y === -dir2.y;
}
