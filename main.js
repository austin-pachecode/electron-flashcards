const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "study.ico"), // <- this line
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// Handle request from renderer for exam list
ipcMain.handle("get-exam-folders", async () => {
  const flashcardsPath = path.join(__dirname, "flashcards");
  const folders = fs
    .readdirSync(flashcardsPath)
    .filter((f) => fs.statSync(path.join(flashcardsPath, f)).isDirectory());
  return folders;
});

ipcMain.handle("get-exam-information", async (_, folder) => {
  const infoPath = path.join(
    __dirname,
    "flashcards",
    folder,
    "information.json"
  );
  const data = fs.readFileSync(infoPath, "utf-8");
  return JSON.parse(data).information;
});

ipcMain.handle("get-flashcard-images", async (_, folder) => {
  const dir = path.join(__dirname, "flashcards", folder, "screenshots");
  const files = fs.readdirSync(dir);
  const pairs = {};

  files.forEach((file) => {
    const match = file.match(/_(q|a)(\d+)\.(jpg|jpeg|png|gif)$/i);
    if (match) {
      const [_, type, num] = match;
      if (!pairs[num]) pairs[num] = {};
      pairs[num][type] = path.join("flashcards", folder, "screenshots", file);
    }
  });

  // Sort numerically and return as array of { question: path, answer: path }
  return Object.keys(pairs)
    .sort((a, b) => a - b)
    .map((k) => pairs[k]);
});

ipcMain.handle("import-exam-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { error: "No folder selected." };
  }

  const selectedPath = result.filePaths[0];
  const examName = path.basename(selectedPath);
  const destPath = path.join(__dirname, "flashcards", examName);

  try {
    // Validate folder
    const infoPath = path.join(selectedPath, "information.json");
    const screenshotsPath = path.join(selectedPath, "screenshots");

    if (!fs.existsSync(infoPath) || !fs.existsSync(screenshotsPath)) {
      return { error: "Folder must contain information.json and screenshots/" };
    }

    // Copy folder into flashcards/
    await fsp.cp(selectedPath, destPath, { recursive: true });

    return { success: true, folder: examName };
  } catch (err) {
    return { error: err.message };
  }
});
