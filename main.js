const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let savePath;

// 获取存档保存路径
function getSavePath() {
  if (!savePath) {
    const userDataPath = app.getPath("userData");
    savePath = path.join(userDataPath, "saves");
    // 确保保存目录存在
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }
  }
  return savePath;
}

// 获取存档文件路径
function getSaveFilePath() {
  return path.join(getSavePath(), "save.json");
}

// 读取存档
function readSave() {
  const filePath = getSaveFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("读取存档失败:", err);
  }
  return null;
}

// 写入存档
function writeSave(saveData) {
  const filePath = getSaveFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("写入存档失败:", err);
    return false;
  }
}

// 导出存档到用户选择的位置
function exportSaveToFile(saveData) {
  return new Promise((resolve, reject) => {
    const filePath = dialog.showSaveDialogSync(mainWindow, {
      title: "导出存档",
      defaultPath: `zijie-save-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (filePath) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2), "utf8");
        resolve(filePath);
      } catch (err) {
        reject(err);
      }
    } else {
      resolve(null);
    }
  });
}

// 从用户选择的文件导入存档
function importSaveFromFile() {
  return new Promise((resolve, reject) => {
    const filePaths = dialog.showOpenDialogSync(mainWindow, {
      title: "导入存档",
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (filePaths && filePaths.length > 0) {
      try {
        const data = fs.readFileSync(filePaths[0], "utf8");
        const saveData = JSON.parse(data);
        resolve(saveData);
      } catch (err) {
        reject(err);
      }
    } else {
      resolve(null);
    }
  });
}

function createWindow() {
  const isDevMode = process.argv.includes("--dev");
  const shouldAutoStartTest = process.argv.includes("--autostart-test");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "字界漫游",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 加载游戏页面
  const indexPath = path.join(__dirname, "src", "index.html");
  mainWindow.loadFile(indexPath);

  if (isDevMode) {
    mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });

    mainWindow.webContents.on("render-process-gone", (event, details) => {
      console.error("渲染进程退出:", details);
    });
  }

  if (shouldAutoStartTest) {
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents
        .executeJavaScript('document.getElementById("startGameButton")?.click();')
        .catch((err) => {
          console.error("自动点击进入游戏失败:", err);
        });

      setTimeout(() => {
        mainWindow.webContents
          .executeJavaScript(`
            ({
              menuHidden: document.getElementById("menuOverlay")?.classList.contains("hidden") ?? false,
              canvasSize: {
                width: window.innerWidth,
                height: window.innerHeight,
              },
            })
          `)
          .then((result) => {
            console.log("自动进入游戏检查:", result);
          })
          .catch((err) => {
            console.error("自动进入游戏检查失败:", err);
          });
      }, 800);
    });
  }

  // 开发模式下打开开发者工具
  if (isDevMode) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 注册 IPC 处理器
ipcMain.handle("save:read", () => {
  return readSave();
});

ipcMain.handle("save:write", (event, saveData) => {
  return writeSave(saveData);
});

ipcMain.handle("save:export", async (event, saveData) => {
  try {
    const filePath = await exportSaveToFile(saveData);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("save:import", async () => {
  try {
    const saveData = await importSaveFromFile();
    return { success: true, saveData };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("save:exists", () => {
  const filePath = getSaveFilePath();
  return fs.existsSync(filePath);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
