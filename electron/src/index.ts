import { BrowserWindow, Menu, app, dialog, ipcMain } from "electron";
import { existsSync } from "fs";
import { copySync, ensureFileSync } from "fs-extra";
import path from "path";
import { init, type Client } from "steamworks.js";
import { IPCService } from "./IPCService";

export type SteamClient = Omit<Client, "init" | "runCallbacks">;

export function getGameSavePath(): string {
   return path.join(app.getPath("appData"), "CivIdleSaves");
}

const createWindow = () => {
   try {
      const steam = init();

      // FIXME: Migrate save, consider removing this later!
      if (!existsSync(getGameSavePath())) {
         const steamId = steam.localplayer.getSteamId().steamId64.toString();
         const oldSavePath = path.join(app.getAppPath(), "save", steamId, "CivIdle");
         const newSavePath = path.join(getGameSavePath(), steamId, "CivIdle");
         if (existsSync(oldSavePath)) {
            ensureFileSync(newSavePath);
            copySync(oldSavePath, newSavePath);
         }
      }

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

      if (app.isPackaged) {
         mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
      } else {
         mainWindow.loadURL("http://localhost:3000");
         mainWindow.webContents.openDevTools();
      }

      mainWindow.removeMenu();
      mainWindow.maximize();
      mainWindow.show();

      const service = new IPCService(steam);

      ipcMain.handle("__RPCCall", (e, method: keyof IPCService, args) => {
         // @ts-expect-error
         return service[method].apply(service, args);
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
   quit();
});

function quit() {
   app.quit();
}
