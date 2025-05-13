// game.js - 完整可拖拽背景找物游戏
const DEBUG_MODE = true; // 调试开关

// 动画函数定义
function animateStartPrompt() {
  if (typeof ctx === 'undefined') return;
  
  let alpha = 0;
  let growing = true;
  const centerX = canvasWidth / 2;
  const promptY = canvasHeight * 0.7;
  
  function pulse() {
    //ctx.clearRect(centerX - 100, promptY - 30, 200, 40);
    
    // ctx.fillStyle = `rgba(189,200,125,${alpha})`;
    // ctx.font = '20px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.fillText('↓ 点击开始游戏 ↓', centerX, promptY);
    
    alpha += growing ? 0.02 : -0.02;
    if (alpha > 0.8) growing = false;
    if (alpha < 0.2) growing = true;
    
    if (gameState.screen === 'start') {
      gameState.animationId = requestAnimationFrame(pulse);
    }
  }
  pulse();
}

function drawErrorScreen(msg) {
  if (typeof ctx === 'undefined') return;
  //错误背景
  //ctx.fillStyle = 'rgba(200,0,0,0.8)';
  //ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  
  const lines = msg.split('\n');
  const startY = canvasHeight / 3;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvasWidth/2, startY + i * 40);
  });
  
  ctx.font = '18px sans-serif';
  ctx.fillText('请重启游戏或联系客服', canvasWidth/2, startY + lines.length * 40 + 60);
}

// 初始化画布
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 导入配置
import { config as gameConfig, canvasWidth, canvasHeight } from './js/base/config';
import { drawStartScreen } from './js/runtime/startScreen';
const config = gameConfig;

// 设备信息
const systemInfo = wx.getSystemInfoSync();
const ratio = systemInfo.pixelRatio;

// 画布设置
canvas.width = canvasWidth * ratio;
canvas.height = canvasHeight * ratio;
ctx.scale(ratio, ratio);

// 游戏状态
let gameState = {
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

// 工具函数：获取缩放后的背景尺寸
function getScaledBgDimensions() {
  return {
    width: config.bgSize.width,
    height: config.bgSize.height
  };
}

// 绘制游戏画面
function drawGame() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (gameState.screen === 'start') {
    // 修改：传递当前关卡和解锁关卡数
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
      // 修复坐标计算：考虑背景偏移和缩放
      // 明确定义绘制坐标和尺寸变量
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
      // 调试信息
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
  // 在drawGame中添加临时调试代码
  console.log('背景尺寸:', getScaledBgDimensions());
  console.log('背景图片:', gameState.bgImage);
  console.log('当前物品:', gameState.currentItems);
}

// 预加载资源
async function preloadAllImages() {
  if (!config.background) throw new Error('背景图路径未配置');
  
  return Promise.all([
    new Promise((resolve, reject) => {
      const bg = wx.createImage();
      bg.src = config.background;
      bg.onload = () => {
        gameState.bgImage = bg;
        resolve();
      };
      bg.onerror = () => reject(new Error('背景图加载失败'));
    }),
    
    ...config.levels.flatMap(level => 
      level.items.map(item => 
        new Promise((resolve, reject) => {
          const img = wx.createImage();
          img.src = item.image;
          img.onload = () => {
            gameState.loadedImages[item.image] = img;
            resolve();
          };
          img.onerror = () => reject(new Error(`图片加载失败: ${item.image}`));
        })
      )
    ),
    
    ...Object.entries(config.audio).map(([key, path]) => 
      new Promise((resolve, reject) => {
        const audio = wx.createInnerAudioContext();
        audio.src = path;
        audio.onCanplay(() => {
          gameState.audioContexts[key] = audio;
          resolve();
        });
        audio.onError(() => reject(new Error(`音效加载失败: ${path}`)));
      })
    )
  ]);
}

function generatePositions(itemCount) {
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

async function initLevel(levelIndex) {
  try {
    if (!gameState.bgImage) await preloadAllImages();
    // 重置游戏状态
    gameState.currentItems = [];
    gameState.foundCount = 0;
    gameState.bgOffset = { x: 0, y: 0 };
    gameState.bgScale = 1.0;
    
    // if (gameState.animationId) {
    //   cancelAnimationFrame(gameState.animationId);
    //   gameState.animationId = null;
    // }
    
    const level = config.levels[levelIndex];
    const positions = generatePositions(level.items.length);

    gameState.currentItems = level.items.map((item, index) => ({
      ...item,
      ...positions[index],
      found: false,
      image: gameState.loadedImages[item.image]
    }));
    
    gameState.foundCount = 0;
    gameState.bgOffset = { x: 0, y: 0 };
    gameState.bgScale = 1.0;
    console.log('关卡初始化完成，物品列表:', gameState.currentItems);
    // 注意：这里不再自动修改 config.currentLevel
    console.log('正在初始化关卡:', levelIndex + 1);
    drawGame();
  } catch (error) {
    console.error('关卡初始化失败:', error);
    drawErrorScreen(`关卡初始化失败: ${error.message}`);
  }
}

function setupTouchEvents() {
  wx.onTouchStart(e => {
    // 输出触摸坐标（调试用）
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
      return; // 忽略边缘点击
    }
      gameState.screen = 'game';
      // 重置游戏状态（新增）
      gameState.foundCount = 0;
      gameState.bgOffset = { x: 0, y: 0 };
      gameState.bgScale = 1.0;
      initLevel(config.currentLevel); // 使用当前关卡索引
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
    // 输出移动坐标（调试用）
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
    // 输出结束坐标（调试用）
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    console.log(`触摸结束坐标: (${endX}, ${endY})`);
    if (!gameState.dragStart || gameState.screen === 'start') return;
    
    const touchX = (e.changedTouches[0].clientX - gameState.bgOffset.x) / gameState.bgScale;
    const touchY = (e.changedTouches[0].clientY - gameState.bgOffset.y) / gameState.bgScale;
    // 输出转换后的游戏坐标（重要！用于关卡编辑）
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

function handleItemFound(item) {
  item.found = true;
  gameState.foundCount++;
  playSound('click');
  
  if (gameState.foundCount === config.levels[config.currentLevel].items.length) {
    playSound('success');
    if (config.currentLevel < config.levels.length - 1) {
      wx.showToast({
        title: '通关成功！',
        complete: () => {
          // 修改：通关后返回开始界面
          gameState.screen = 'start';
          config.currentLevel++; // 递增关卡
          gameState.foundCount = 0; // 重置找到物品计数
          drawGame(); // 重绘界面
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

function playSound(type) {
  const audio = gameState.audioContexts[type];
  if (audio) {
    audio.stop();
    audio.seek(0);
    audio.play();
  }
}

export default class Main {
  constructor() {
    console.log('画布初始尺寸:', canvasWidth, canvasHeight);
    // 删除以下两行（避免覆盖开始界面背景）
    // ctx.fillStyle = '#2c3e50';
    // ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    //setupTouchEvents();
    this.init();
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
        drawGame();// 这里会绘制开始界面
        console.log('资源加载完成，显示开始界面');
      })
      .catch(err => {
        console.error('初始化失败:', err);
        drawErrorScreen(`加载失败: ${err.message}`);
      });
  }
}

const game = new Main();