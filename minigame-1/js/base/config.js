// config.js
const systemInfo = wx.getSystemInfoSync();

export const config = {
  
  currentLevel: 0,
  itemSize: 80,
  minSpacing: 40,
  bgSize: { width: 2000, height: 2000 }, // 新增背景尺寸配置
  background: 'images/game_bg.jpg', // 确保该路径下存在图片文件
  levels: [ 
    {
      title: "第1关",
      items: [
        { name: "苹果", image: 'images/apple.png' }, // 确认图片路径存在
        { name: "樱桃", image: 'images/cherry.png' },
        { name: "香蕉", image: 'images/banana.png' }
      ]
    },
    // 新增动物乐园关卡
    {
        title: "第2关",
        items: [
          { name: "熊猫", image: 'images/fish.png' },
          { name: "兔子", image: 'images/dog.png' },
          { name: "狮子", image: 'images/cat.png' }
        ]
      }
  ],
  debug: {
    showItemBounds: true,  // 显示物品边界框
    showCoordinates: true  // 显示坐标
  },
  audio: {
    click: 'audio/click.mp3',
    success: 'audio/success.mp3'
  }
  
};
/* - systemInfo 通过 wx.getSystemInfoSync() 获取，是微信小程序API提供的设备信息对象
- windowWidth / windowHeight 表示小程序可使用窗口的宽高（物理像素）
- 这种设置方式可以：
- 自动适配不同设备屏幕尺寸
- 确保画布初始化时与设备显示区域匹配
- 为后续元素布局提供基准坐标系统 */
export const canvasWidth = systemInfo.windowWidth;
export const canvasHeight = systemInfo.windowHeight;