# 幕影记

“幕影记”是一款以中国皮影戏为舞台的开源 WebXR 音乐互动体验，面向 PICO 4 Ultra 与支持 WebXR 的桌面浏览器。

## 当前版本

- 固定曲目《侠客行》，运行 BPM 为 143。
- 黑金视觉体系与极简入口。
- GLB 骨骼皮影人物，包含问候、行走、奔跑与飞行动画。
- 侠客、女将、老者和反派分别使用不同的 UV 皮肤。
- 故事采用逐击时间线：每次有效击打只触发一个资产的一次动作。
- 人物及背景均具有入场、表演和出场阶段，远景、中景、前景形成舞台深度。
- 不计分模式。

## 本地运行

```bash
npm install
NODE_OPTIONS='--no-experimental-webstorage --openssl-legacy-provider' npm run build
python3 -m http.server 3001 --bind 0.0.0.0
```

打开 `http://localhost:3001/`。

有线连接 PICO 后，可使用：

```bash
pico-cli adb reverse tcp:3001 tcp:3001
pico-cli shell am start -a android.intent.action.VIEW -d http://localhost:3001/
```

## 素材说明

仓库包含运行所需的音乐、GLB、人物皮肤、舞台分层与皮影场景素材。使用或再发布第三方素材前，请自行确认相应授权范围。

本项目基于开源项目 [Moon Rider](https://github.com/supermedium/moonrider) 改造，并保留原项目许可证与版权声明。
