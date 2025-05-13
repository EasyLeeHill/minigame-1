// resourceLoader.js
import { config } from './js/base/config.js';

export async function preloadAllImages() {
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