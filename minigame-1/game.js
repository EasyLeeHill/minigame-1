// game.js - 完整可拖拽背景找物游戏
import { animateStartPrompt } from './main/animation.js';
import { drawErrorScreen } from './main/errorScreen.js';
import { drawGame } from './main/gameRenderer.js';
import { preloadAllImages } from './main/resourceLoader.js';
import { initLevel } from './main/levelInitializer.js';
import { setupTouchEvents } from './main/touchEvents.js';
import { handleItemFound } from './main/itemHandler.js';
import { playSound } from './main/soundPlayer.js';
import { getScaledBgDimensions } from './main/utils.js';
import { config as gameConfig, canvasWidth, canvasHeight } from './js/base/config';
import { drawStartScreen } from './js/runtime/startScreen';

const DEBUG_MODE = true; // 调试开关
const config = gameConfig;

// 初始化画布
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 设备信息
const systemInfo = wx.getSystemInfoSync();
const ratio = systemInfo.pixelRatio;

// 画布设置
canvas.width = canvasWidth * ratio;
canvas.height = canvasHeight * ratio;
ctx.scale(ratio, ratio);

// 游戏状态
export let gameState = {
  loadedImages: {},
  bgImage: null,
  animationId: null,
  audioContexts: {},
  currentItems: [],
  foundCount: 0,
  bgOffset: { x: 0, y: 0 },
  dragStart: null,
  screen: 'start',
  unlockedLevels: 2,
  bgScale: 1.0,
  initialDistance: null
};

export default class Main {
  constructor() {
    console.log('画布初始尺寸:', canvasWidth, canvasHeight);
    this.init();
    setupTouchEvents();
  }

  init() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('资源加载中...', canvasWidth/2, canvasHeight/2);

    preloadAllImages()
      .then(() => {
        gameState.screen = 'start';
        drawGame();
        console.log('资源加载完成，显示开始界面');
      })
      .catch(err => {
        console.error('初始化失败:', err);
        drawErrorScreen(`加载失败: ${err.message}`);
      });
  }
}

const game = new Main();