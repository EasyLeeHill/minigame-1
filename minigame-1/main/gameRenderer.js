// gameRenderer.js
import { drawStartScreen } from './js/runtime/startScreen.js';
import { animateStartPrompt } from './animation.js';
import { getScaledBgDimensions } from './utils.js';

export function drawGame() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (gameState.screen === 'start') {
    drawStartScreen(ctx, DEBUG_MODE, {
      current: config.currentLevel,
      total: config.levels.length
    });
    animateStartPrompt();
    return;
  }
  // 绘制背景
  if (gameState.bgImage) {
    const { width: bgWidth, height: bgHeight } = getScaledBgDimensions();
    ctx.drawImage(
      gameState.bgImage,
      gameState.bgOffset.x,
      gameState.bgOffset.y,
      bgWidth * gameState.bgScale,
      bgHeight * gameState.bgScale
    );
  }

  // 绘制物品
  gameState.currentItems.forEach(item => {
    if (!item.found && item.image) {
      const itemDrawX = item.x * gameState.bgScale + gameState.bgOffset.x;
      const itemDrawY = item.y * gameState.bgScale + gameState.bgOffset.y;
      const itemDrawSize = config.itemSize * gameState.bgScale;
      ctx.drawImage(
        item.image,
        itemDrawX,
        itemDrawY,
        itemDrawSize,
        itemDrawSize
      );
      if (DEBUG_MODE) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(itemDrawX, itemDrawY, itemDrawSize, itemDrawSize);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(
          `${item.name}:${Math.floor(item.x)},${Math.floor(item.y)}`, 
          itemDrawX, 
          itemDrawY - 5
        );
      }
    }
  });

  // 绘制UI
  ctx.save();
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`第 ${config.currentLevel + 1} 关`, 20, 40);
  ctx.fillText(`找到: ${gameState.foundCount}/${config.levels[config.currentLevel].items.length}`, 20, 120);

  if (DEBUG_MODE) {
    ctx.fillText(`画布: ${canvasWidth}x${canvasHeight}`, 20, 100);
    ctx.fillText(`缩放: ${gameState.bgScale.toFixed(2)}x`, 20, 130);
    ctx.fillText(`偏移: (${Math.floor(gameState.bgOffset.x)},${Math.floor(gameState.bgOffset.y)})`, 20, 160);

    ctx.font = '14px Arial';
    let yPos = 190;
    gameState.currentItems.forEach((item, index) => {
      ctx.fillText(
        `物品${index + 1}: ${item.name} @ (${Math.floor(item.x)},${Math.floor(item.y)})`, 
        20, 
        yPos
      );
      yPos += 20;
    });
  }
  ctx.restore();
  console.log('背景尺寸:', getScaledBgDimensions());
  console.log('背景图片:', gameState.bgImage);
  console.log('当前物品:', gameState.currentItems);
}