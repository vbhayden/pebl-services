import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { Asset } from "../models/asset";

export interface AssetManager extends PeBLPlugin {

  validateGetAssets(payload: { [key: string]: any }): boolean;
  validateSaveAssets(payload: { [key: string]: any }): boolean;
  validateDeleteAsset(payload: { [key: string]: any }): boolean;

  getAssets(userProfile: UserProfile, callback: ((assets: Asset[]) => void)): void;
  saveAssets(userProfile: UserProfile, assets: Asset[]): void;
  deleteAsset(userProfile: UserProfile, id: string): void;
}
