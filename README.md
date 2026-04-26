# 字界漫游 - Electron 桌面版

## 运行方式

### 网页版

```bash
# 生成可部署的静态网页版
npm run web:build

# 本地预览网页版
npm run web:serve
```

网页版构建产物输出到 `web-dist/`，可直接部署到 GitHub Pages、Nginx 或任意静态站点托管服务。推送到 GitHub 的 `main` 分支后，仓库内的 GitHub Actions 会自动构建并发布 Pages。浏览器版会使用 `localStorage` 保存进度；Electron 版仍使用原生文件存档。


### 开发模式
```bash
npm install
npm start
```

### 构建打包
```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

### Android APK
```bash
# 首次初始化 Android 工程
npm run android:init

# 同步前端资源到 Android 工程
npm run android:sync

# 构建调试版 APK
npm run android:build:debug
```

调试版 APK 输出路径：
`android/app/build/outputs/apk/debug/app-debug.apk`

说明：
- `android:build:debug` 会自动同步 `src/` 资源并调用 Gradle 打包
- 当前产物是调试版 APK，适合本地安装测试
- 如果后续需要上架，还要再补签名并生成 release APK 或 AAB

## 存档位置

### macOS
`~/Library/Application Support/zijie-man-you/saves/save.json`

### Windows
`%APPDATA%\zijie-man-you\saves\save.json`

### Linux
`~/.config/zijie-man-you/saves/save.json`

## 功能特性

- **自动存档**: 游戏进度自动保存到本地文件
- **导出存档**: 可将存档导出为 JSON 文件备份
- **导入存档**: 可从 JSON 文件恢复存档
- **原生窗口**: 使用系统原生窗口和对话框

## 控制说明

- 方向键 / WASD: 移动
- J: 攻击
- U: 职业技
- I: 施展武功
- O: 切换武功
- K / 空格: 与 NPC、遗迹互动
- M: 开关地图
