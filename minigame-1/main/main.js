// main.js
import { initGame } from './gameInitializer.js';
import { setupTouchEvents } from './touchEvents.js';

export default class Main {
  constructor() {
    console.log('画布初始尺寸:', canvasWidth, canvasHeight);
    this.init();
  }

  init() {
    initGame()
     .then(() => {
        gameState.screen = 'start';
        drawGame();
        console.log('资源加载完成，显示开始界面');
        setupTouchEvents();
      })
     .catch(err => {
        console.error('初始化失败:', err);
        drawErrorScreen(`加载失败: ${err.message}`);
      });
  }
}

const game = new Main();