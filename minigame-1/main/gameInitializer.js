// gameInitializer.js
import { preloadAllImages } from './resourceLoader.js';
import { initLevel } from './levelInitializer.js';
import { drawErrorScreen } from './errorScreen.js';

export async function initGame() {
  try {
    await preloadAllImages();
    initLevel(config.currentLevel);
  } catch (error) {
    throw error;
  }
}