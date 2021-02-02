import { PeBLPlugin } from "../models/peblPlugin";

export interface EpubManager extends PeBLPlugin {
  uploadEpub(epubFilePath: string): Promise<boolean>;
  deleteEpub(id: string): Promise<boolean>;
}