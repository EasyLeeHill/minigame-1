// positionGenerator.js
import { config } from './js/base/config.js';

export function generatePositions(itemCount) {
  const positions = [];
  const margin = 50;
  const safeWidth = config.bgSize.width - margin * 2 - config.itemSize;
  const safeHeight = config.bgSize.height - margin * 2 - config.itemSize;

  for (let i = 0; i < itemCount; i++) {
    let pos, isValid, attempts = 0;

    do {
      pos = {
        x: margin + Math.random() * safeWidth,
        y: margin + Math.random() * safeHeight
      };

      isValid = positions.every(existPos => {
        const dx = pos.x - existPos.x;
        const dy = pos.y - existPos.y;
        return Math.sqrt(dx * dx + dy * dy) > (config.itemSize + config.minSpacing);
      });

      attempts++;
    } while (!isValid && attempts < 100);

    if (!isValid) {
      console.warn(`元素${i}位置生成失败，使用备用位置`);
      pos = { x: margin, y: margin };
    }

    positions.push(pos);
  }

  return positions;
}