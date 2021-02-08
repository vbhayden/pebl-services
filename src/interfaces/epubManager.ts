import { PeBLPlugin } from "../models/peblPlugin";

export interface EpubManager extends PeBLPlugin {
  uploadEpub(epubFilePath: string): Promise<{ status: number, message: string }>;
  deleteEpub(id: string): Promise<{ status: number, message: string }>;
}