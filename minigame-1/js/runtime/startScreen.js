import { canvasWidth, canvasHeight } from '../base/config';
//ceshi 
// 预加载开始界面背景图
let startBgImage = wx.createImage();
startBgImage.src = 'images/start_bg.jpg'; // 替换为你的图片路径

export function drawStartScreen(ctx, debugMode = false, { 
  current = 0, 
  total = 1 
} = {}) {
  // 1. 绘制背景图片（优先）或备用纯色背景
  if (startBgImage && startBgImage.width > 0) {
    // 全屏平铺背景图（保持比例）
    const imgRatio = startBgImage.width / startBgImage.height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgRatio > canvasRatio) {
      // 图片更宽，按高度适配
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
    } else {
      // 图片更高，按宽度适配
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imgRatio;
      offsetY = (canvasHeight - drawHeight) / 2;
    }
    
    ctx.drawImage(
      startBgImage,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );
  } else {
    // 备用纯色背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 显示加载提示（仅在调试模式）
    if (debugMode) {
      ctx.fillStyle = '#FFF';
      ctx.font = '16px Arial';
      ctx.fillText('背景图加载中...', 20, 30);
    }
  }

  // 2. 半透明遮罩提升文字可读性
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 3. 绘制标题
  const title = '找物游戏';
  const titleX = canvasWidth * 0.5;
  const titleY = canvasHeight * 0.3;
  
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, titleX, titleY);

  // 4. 绘制关卡信息
  ctx.font = '24px Arial';
  ctx.fillText(
    `关卡进度: ${current + 1}/${total}`,
    titleX,
    titleY + 60
  );

  // 5. 绘制开始提示
  const prompt = '点击任意位置开始';
  ctx.font = '20px Arial';
  ctx.fillText(prompt, titleX, titleY + 120);

  // 6. 调试信息
  if (debugMode) {
    ctx.font = '14px Arial';
    ctx.fillText(
      `画布: ${canvasWidth}x${canvasHeight} | 背景图: ${startBgImage ? '已加载' : '未加载'}`,
      20,
      40
    );
  }
}