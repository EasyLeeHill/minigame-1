// game.js - 完整可拖拽背景找物游戏
const DEBUG_MODE = true; // 调试开关
// 动画函数定义
function animateStartPrompt() {
  if (typeof ctx === 'undefined') return; // 安全保护
  
  let alpha = 0;
  let growing = true;
  const centerX = canvasWidth / 2;
  const promptY = canvasHeight * 0.7;
  
  function pulse() {
    // 清除之前绘制的动画区域（避免重叠）
    ctx.clearRect(centerX - 100, promptY - 30, 200, 40);
    
    // 绘制动画文字
    ctx.fillStyle = `rgba(189,200,125,${alpha})`;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↓ 点击开始游戏 ↓', centerX, promptY);
    
    // 更新动画状态
    alpha += growing ? 0.02 : -0.02;
    if (alpha > 0.8) growing = false;
    if (alpha < 0.2) growing = true;
    
    // 仅在开始界面继续动画
    if (gameState.screen === 'start') {
      gameState.animationId = requestAnimationFrame(pulse); // 存储动画ID
    }
  }
  pulse();
}

// 错误界面绘制函数
function drawErrorScreen(msg) {
  if (typeof ctx === 'undefined') return;
  
  // 红色错误背景
  ctx.fillStyle = 'rgba(200,0,0,0.8)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // 白色错误文字
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  
  // 分段显示错误信息
  const lines = msg.split('\n');
  const startY = canvasHeight / 3;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvasWidth/2, startY + i * 40);
  });
  
  // 添加操作提示
  ctx.font = '18px sans-serif';
  ctx.fillText('请重启游戏或联系客服', canvasWidth/2, startY + lines.length * 40 + 60);
}

// 初始化画布
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 导入配置和工具函数
import { config as gameConfig, canvasWidth, canvasHeight } from './js/base/config';
import { drawStartScreen, initStartScreen } from './js/runtime/startScreen';
const config = gameConfig; // 避免命名冲突

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
  animationId: null, // 新增动画ID跟踪
  audioContexts: {},
  currentItems: [],
  foundCount: 0,
  bgOffset: { x: 0, y: 0 },
  dragStart: null,
  screen: 'start',
  unlockedLevels: 2
};

// 工具函数：获取缩放后的背景尺寸
function getScaledBgDimensions() {
  const bgRatio = Math.max(
    canvasWidth / config.bgSize.width,
    canvasHeight / config.bgSize.height
  );
  return {
    width: config.bgSize.width,
    height: config.bgSize.height
  };
}

// 预加载资源
async function preloadAllImages() {
  if (!config.background) throw new Error('背景图路径未配置');
  
  return Promise.all([
    // 加载背景
    new Promise((resolve, reject) => {
      const bg = wx.createImage();
      bg.src = config.background;
      bg.onload = () => {
        gameState.bgImage = bg;
        resolve();
      };
      bg.onerror = () => reject(new Error('背景图加载失败'));
    }),
    
    // 加载元素图片
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
    
    // 加载音效
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

// 生成随机位置
function generatePositions(itemCount) {
  const positions = [];
  const margin = 50;
  // 改用背景图片原始尺寸
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

// 初始化关卡
async function initLevel(levelIndex) {
  try {
    if (!gameState.bgImage) await preloadAllImages();
    if (gameState.animationId) {
      cancelAnimationFrame(gameState.animationId);
      gameState.animationId = null;
    }
    const { width: bgWidth, height: bgHeight } = getScaledBgDimensions();
    const level = config.levels[levelIndex];
    const positions = generatePositions(level.items.length);

    gameState.currentItems = level.items.map((item, index) => ({
      ...item,
      ...positions[index],
      // 移除缩放系数计算
      found: false,
      image: gameState.loadedImages[item.image]
    }));
    
    gameState.bgOffset = { 
      x: (canvasWidth - config.bgSize.width) / 2,
      y: (canvasHeight - config.bgSize.height) / 2
    };
    gameState.foundCount = 0;
    gameState.screen = 'game';
    drawGame();
  } catch (err) {
    console.error('关卡初始化失败:', err);
    wx.showToast({ 
      title: err.message || '资源加载失败',
      icon: 'none',
      duration: 3000
    });
  }
}

// 绘制游戏画面
function drawGame() {
  
  // console.log('当前游戏状态:', {
  //   screen: gameState.screen,
  //   bgImage: !!gameState.bgImage,
  //   items: gameState.currentItems.length
  // });
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // 新增：清除动画提示区域（重要）
  const centerX = canvasWidth * 0.5;
  const promptY = canvasHeight * 0.7;
  ctx.clearRect(centerX - 100, promptY - 30, 200, 40);

  if (gameState.screen === 'start') {
    console.log('正在绘制开始界面');
    try {
      drawStartScreen(ctx, DEBUG_MODE);
      // 添加屏幕点击提示动画
      animateStartPrompt();
    } catch (err) {
      console.error('开始界面绘制失败:', err);
      drawErrorScreen('开始界面渲染异常');
    }
    return;
  }

  const { width: bgWidth, height: bgHeight } = getScaledBgDimensions();

  // 绘制背景
  if (gameState.bgImage) {
    ctx.save();
    ctx.translate(gameState.bgOffset.x, gameState.bgOffset.y);
    // 修改背景绘制参数
    ctx.drawImage(gameState.bgImage, 0, 0, config.bgSize.width, config.bgSize.height);
    
    // 绘制元素
    gameState.currentItems.forEach(item => {
      if (!item.found && item.image) {
        ctx.drawImage(item.image, item.x, item.y, config.itemSize, config.itemSize);
        if (DEBUG_MODE) {
          ctx.strokeStyle = 'red';
          ctx.strokeRect(item.x, item.y, config.itemSize, config.itemSize);
          
        }
      }
    });
    ctx.restore();
  }

  // 绘制UI
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`第 ${config.currentLevel + 1} 关`, 20, 40);
  ctx.fillText(`找到: ${gameState.foundCount}/${config.levels[config.currentLevel].items.length}`, 20, 70);

  // 新增画布尺寸显示（调试用）
  if (DEBUG_MODE) {
    ctx.fillText(`画布: ${canvasWidth}x${canvasHeight}`, 20, 100);
    ctx.font = '14px Arial';
    let yPos = 150;
    gameState.currentItems.forEach((item, index) => {
      ctx.fillText(`元素${index + 1}: (${Math.floor(item.x)},${Math.floor(item.y)})`, 20, yPos);
      yPos += 20;
    });
  }
}

// 触摸事件处理
function setupTouchEvents() {
  
  wx.onTouchStart(e => {
    console.log('触摸事件触发，当前界面:', gameState.screen); // 调试
    if (gameState.screen === 'start') {
      console.log('从开始界面切换到游戏'); // 调试
      initLevel(0);
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
    if (!gameState.dragStart || gameState.screen === 'start') return;
    
    const { width: bgWidth, height: bgHeight } = getScaledBgDimensions();
    const delta = {
      x: (e.touches[0].clientX - gameState.dragStart.x) * config.dragSensitivity,
      y: (e.touches[0].clientY - gameState.dragStart.y) * config.dragSensitivity
    };

    const maxX = Math.max(0, bgWidth - canvasWidth);
    const maxY = Math.max(0, bgHeight - canvasHeight);
    
    gameState.bgOffset.x = Math.min(0, Math.max(-maxX, gameState.dragStart.offsetX + delta.x));
    gameState.bgOffset.y = Math.min(0, Math.max(-maxY, gameState.dragStart.offsetY + delta.y));

    drawGame();
  });

  wx.onTouchEnd(e => {
    if (!gameState.dragStart || gameState.screen === 'start') return;
    
    const touchX = e.changedTouches[0].clientX - gameState.bgOffset.x;
    const touchY = e.changedTouches[0].clientY - gameState.bgOffset.y;
    
    // 点击检测（移动距离<5px视为点击）
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

// 处理找到物品
function handleItemFound(item) {
  item.found = true;
  gameState.foundCount++;
  playSound('click');
  
  if (gameState.foundCount === config.levels[config.currentLevel].items.length) {
    playSound('success');
    if (config.currentLevel < config.levels.length - 1) {
      wx.showToast({
        title: '通关成功！',
        complete: () => setTimeout(() => initLevel(++config.currentLevel), 1500)
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

// 播放音效
function playSound(type) {
  const audio = gameState.audioContexts[type];
  if (audio) {
    audio.stop();
    audio.seek(0);
    audio.play();
  }
}

// 游戏主类
export default class Main {
  constructor() {
    console.log('画布初始尺寸:', canvasWidth, canvasHeight); // 调试
  
  // 立即绘制一个临时背景
  ctx.fillStyle = '#123456';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    //initStartScreen(canvasWidth, canvasHeight);
    setupTouchEvents();
    this.init();
  }

  init() {
    // 先立即绘制黑色加载中背景
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#FFF';
    ctx.fillText('资源加载中...', canvasWidth/2, canvasHeight/2);

    preloadAllImages()
      .then(() => {
        gameState.screen = 'start';
        drawGame();
        console.log('资源加载完成，显示开始界面'); // 调试日志
      })
      .catch(err => {
        console.error('初始化失败:', err);
        // 显示错误界面
        ctx.fillStyle = '#f00';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#FFF';
        ctx.fillText(`加载失败: ${err.message}`, 50, 50);
      });
  }
}

// 启动游戏
const game = new Main();