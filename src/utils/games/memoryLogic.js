export const DEFAULT_ICONS = ['🚀', '💻', '⚡', '🦄', '☕', '🎮', '🛡️', '💎', '🎨', '🔥', '🧩', '🌟'];

export function generateCards(pairCount = 8) {
  const selectedSymbols = DEFAULT_ICONS.slice(0, pairCount);
  const cardPool = [];

  selectedSymbols.forEach((symbol, index) => {
    cardPool.push({
      id: `${symbol}-a-${index}`,
      symbol,
      isFlipped: false,
      isMatched: false,
    });
    cardPool.push({
      id: `${symbol}-b-${index}`,
      symbol,
      isFlipped: false,
      isMatched: false,
    });
  });

  // Fisher-Yates 洗牌
  for (let i = cardPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
  }

  return cardPool;
}

export function checkMatch(cardA, cardB) {
  if (!cardA || !cardB) return false;
  return cardA.symbol === cardB.symbol;
}

export function isAllMatched(cards) {
  return cards.length > 0 && cards.every((c) => c.isMatched);
}
