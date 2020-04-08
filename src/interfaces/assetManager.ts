import { PeBLPlugin } from "../models/peblPlugin";
import { Asset } from "../models/asset";

export interface AssetManager extends PeBLPlugin {

  validateGetAssets(payload: { [key: string]: any }): boolean;
  validateSaveAssets(payload: { [key: string]: any }): boolean;
  validateDeleteAsset(payload: { [key: string]: any }): boolean;

  getAssets(identity: string, callback: ((assets: Asset[]) => void)): void;
  saveAssets(identity: string, assets: Asset[]): void;
  deleteAsset(identity: string, id: string): void;
}
