// errorScreen.js
export function drawErrorScreen(msg) {
    if (typeof ctx === 'undefined') return;
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