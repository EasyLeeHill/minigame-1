// animation.js
export function animateStartPrompt() {
    if (typeof ctx === 'undefined') return;
  
    let alpha = 0;
    let growing = true;
    const centerX = canvasWidth / 2;
    const promptY = canvasHeight * 0.7;
  
    function pulse() {
      alpha += growing ? 0.02 : -0.02;
      if (alpha > 0.8) growing = false;
      if (alpha < 0.2) growing = true;
  
      if (gameState.screen === 'start') {
        gameState.animationId = requestAnimationFrame(pulse);
      }
    }
    pulse();
  }