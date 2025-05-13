// touchEvents.js
import { initLevel } from './levelInitializer.js';
import { drawGame } from './gameRenderer.js';
import { handleItemFound } from './itemHandler.js';

export function setupTouchEvents() {
  wx.onTouchStart(e => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    console.log(`触摸开始坐标: (${touchX}, ${touchY})`);
    if (e.touches.length === 2) {
      gameState.initialDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      return;
    }

    if (gameState.screen === 'start') {
      const centerX = canvasWidth/2;
      const centerY = canvasHeight/2;
      if (Math.abs(e.touches[0].clientX - centerX) > 200 || 
        Math.abs(e.touches[0].clientY - centerY) > 100) {
        return; 
      }
      gameState.screen = 'game';
      gameState.foundCount = 0;
      gameState.bgOffset = { x: 0, y: 0 };
      gameState.bgScale = 1.0;
      initLevel(config.currentLevel); 
      return;
    }

    gameState.dragStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      offsetX: gameState.bgOffset.x,
      offsetY: gameState.bgOffset.y
    };
  });

  wx.onTouchMove(e => {
    if (DEBUG_MODE && e.touches.length === 1) {
      const moveX = e.touches[0].clientX;
      const moveY = e.touches[0].clientY;
      console.log(`触摸移动坐标: (${moveX}, ${moveY})`);
    }
    if (e.touches.length === 2) {
      const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      const scaleFactor = currentDistance / gameState.initialDistance;
      gameState.bgScale = Math.min(3, Math.max(0.5, gameState.bgScale * scaleFactor));

      gameState.initialDistance = currentDistance;
      drawGame();
      return;
    }

    if (!gameState.dragStart || gameState.screen === 'start') return;

    const { width: bgWidth, height: bgHeight } = getScaledBgDimensions();
    const delta = {
      x: (e.touches[0].clientX - gameState.dragStart.x) * 1.5,
      y: (e.touches[0].clientY - gameState.dragStart.y) * 1.5
    };

    const maxX = Math.max(0, bgWidth * gameState.bgScale - canvasWidth);
    const maxY = Math.max(0, bgHeight * gameState.bgScale - canvasHeight);

    gameState.bgOffset.x = Math.min(0, Math.max(-maxX, gameState.dragStart.offsetX + delta.x));
    gameState.bgOffset.y = Math.min(0, Math.max(-maxY, gameState.dragStart.offsetY + delta.y));

    drawGame();
  });

  wx.onTouchEnd(e => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    console.log(`触摸结束坐标: (${endX}, ${endY})`);
    if (!gameState.dragStart || gameState.screen === 'start') return;

    const touchX = (e.changedTouches[0].clientX - gameState.bgOffset.x) / gameState.bgScale;
    const touchY = (e.changedTouches[0].clientY - gameState.bgOffset.y) / gameState.bgScale;
    console.log(`游戏内坐标: (${Math.floor(touchX)}, ${Math.floor(touchY)})`);
    console.log(`转换后点击坐标: (${touchX}, ${touchY})`);
    if (Math.hypot(
      e.changedTouches[0].clientX - gameState.dragStart.x,
      e.changedTouches[0].clientY - gameState.dragStart.y
    ) < 5) {
      gameState.currentItems.some(item => {
        if (item.found) return false;

        const isHit = (
          touchX >= item.x &&
          touchX <= item.x + config.itemSize &&
          touchY >= item.y &&
          touchY <= item.y + config.itemSize
        );

        if (isHit) {
          handleItemFound(item);
          return true;
        }
        return false;
      });
    }

    gameState.dragStart = null;
  });
}