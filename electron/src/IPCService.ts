import { shell } from "electron";
import { exists, outputFile, readFile, unlink } from "fs-extra";
import path from "path";
import { getGameSavePath, type SteamClient } from ".";

export class IPCService {
   private _client: SteamClient;

   constructor(steam: SteamClient) {
      this._client = steam;
   }

   public fileWrite(name: string, content: string): void {
      outputFile(path.join(getGameSavePath(), this.getSteamId(), name), content);
   }

   public fileWriteBytes(name: string, content: ArrayBuffer): void {
      outputFile(path.join(getGameSavePath(), this.getSteamId(), name), Buffer.from(content));
   }

   public async fileRead(name: string): Promise<string> {
      const content = await readFile(path.join(getGameSavePath(), this.getSteamId(), name));
      return content.toString("utf-8");
   }

   public async fileReadBytes(name: string): Promise<ArrayBuffer> {
      const content = await readFile(path.join(getGameSavePath(), this.getSteamId(), name));
      return content.buffer;
   }

   public async fileDelete(name: string): Promise<void> {
      const filePath = path.join(getGameSavePath(), this.getSteamId(), name);
      if (await exists(filePath)) {
         unlink(filePath);
      }
   }

   public openUrl(url: string): void {
      shell.openExternal(url);
   }

   public getSteamId(): string {
      return this._client.localplayer.getSteamId().steamId64.toString();
   }

   public async getAuthSessionTicket(): Promise<string> {
      return (await this._client.auth.getSessionTicket()).getBytes().toString("hex");
   }

   public getAppId(): number {
      return this._client.utils.getAppId();
   }

   public getBetaName(): string {
      return this._client.apps.currentBetaName() ?? "";
   }
}
