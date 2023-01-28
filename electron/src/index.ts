import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import { outputFile } from "fs-extra";
import { readFile } from "fs/promises";
import path from "path";
import { SteamAPI } from "./steam";

const createWindow = () => {
   try {
      const api = new SteamAPI();
      const mainWindow = new BrowserWindow({
         webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            devTools: !app.isPackaged,
            backgroundThrottling: false,
         },
         minHeight: 640,
         minWidth: 1136,
         show: false,
      });
      // and load the index.html of the app.
      app.isPackaged
         ? mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
         : mainWindow.loadURL("http://localhost:3000");

      if (!app.isPackaged) {
         mainWindow.webContents.openDevTools();
      }

      mainWindow.removeMenu();
      mainWindow.maximize();
      mainWindow.show();

      ipcMain.handle("writeTextToFile", (e, name: string, content: string) => {
         return outputFile(path.join(app.getAppPath(), "save", api.getSteamId().toString(), name), content);
      });

      ipcMain.handle("readTextFromFile", (e, name: string) => {
         return readFile(path.join(app.getAppPath(), "save", api.getSteamId().toString(), name));
      });
   } catch (error) {
      dialog.showErrorBox("Failed to Start Game", String(error));
      quit();
   }
};

Menu.setApplicationMenu(null);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
   SteamAPI.shutdown();
   quit();
});

function quit() {
   SteamAPI.shutdown();
   app.quit();
}