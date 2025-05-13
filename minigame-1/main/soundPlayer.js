// soundPlayer.js
export function playSound(type) {
    const audio = gameState.audioContexts[type];
    if (audio) {
      audio.stop();
      audio.seek(0);
      audio.play();
    }
  }