const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getExamFolders: () => ipcRenderer.invoke("get-exam-folders"),
  getExamInformation: (folder) =>
    ipcRenderer.invoke("get-exam-information", folder),
  getFlashcardImages: (folder) =>
    ipcRenderer.invoke("get-flashcard-images", folder),
  importExamFolder: () => ipcRenderer.invoke("import-exam-folder"),
});
