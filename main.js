const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
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
