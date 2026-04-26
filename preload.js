const { contextBridge, ipcRenderer } = require("electron");

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld("electronAPI", {
  // 读取存档（自动从本地文件读取）
  readSave: () => ipcRenderer.invoke("save:read"),

  // 写入存档（自动保存到本地文件）
  writeSave: (saveData) => ipcRenderer.invoke("save:write", saveData),

  // 导出存档（用户选择位置）
  exportSave: (saveData) => ipcRenderer.invoke("save:export", saveData),

  // 导入存档（用户选择文件）
  importSave: () => ipcRenderer.invoke("save:import"),

  // 检查存档是否存在
  saveExists: () => ipcRenderer.invoke("save:exists"),
});
