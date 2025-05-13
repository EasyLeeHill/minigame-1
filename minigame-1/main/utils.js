// utils.js
import { config } from './js/base/config.js';

export function getScaledBgDimensions() {
  return {
    width: config.bgSize.width,
    height: config.bgSize.height
  };
}