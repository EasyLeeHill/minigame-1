// levelInitializer.js
import { generatePositions } from './positionGenerator.js';
import { drawGame } from './gameRenderer.js';

export async function initLevel(levelIndex) {
  try {
    if (!gameState.bgImage) await preloadAllImages();
    // 重置游戏状态
    gameState.currentItems = [];
    gameState.foundCount = 0;
    gameState.bgOffset = { x: 0, y: 0 };
    gameState.bgScale = 1.0;

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
    console.log('正在初始化关卡:', levelIndex + 1);
    drawGame();
  } catch (error) {
    console.error('关卡初始化失败:', error);
    drawErrorScreen(`关卡初始化失败: ${error.message}`);
  }
}