// itemHandler.js
import { drawGame } from './gameRenderer.js';
import { playSound } from './soundPlayer.js';

export function handleItemFound(item) {
  item.found = true;
  gameState.foundCount++;
  playSound('click');

  if (gameState.foundCount === config.levels[config.currentLevel].items.length) {
    playSound('success');
    if (config.currentLevel < config.levels.length - 1) {
      wx.showToast({
        title: '通关成功！',
        complete: () => {
          gameState.screen = 'start';
          config.currentLevel++; 
          gameState.foundCount = 0; 
          drawGame(); 
        }
      });
    } else {
      wx.showModal({ 
        title: '恭喜', 
        content: '全部关卡通关！', 
        showCancel: false 
      });
    }
  }

  drawGame();
}