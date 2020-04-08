import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { UserProfile } from "../models/userProfile";
import { AssetManager } from "../interfaces/assetManager";
import { Asset } from "../models/asset";
import { generateUserAssetKey, generateAssetsKey } from "../utils/constants";

export class DefaultAssetManager extends PeBLPlugin implements AssetManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetAssets(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveAssets(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteAsset(payload: { [key: string]: any }): boolean {
    return false;
  }

  getAssets(userProfile: UserProfile, callback: ((assets: Asset[]) => void)): void {
    this.sessionData.getHashValues(generateUserAssetKey(userProfile.identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Asset(JSON.parse(x));
        }));
      });
  }

  saveAssets(userProfile: UserProfile, assets: Asset[]): void {
    let arr = [];
    for (let asset of assets) {
      arr.push(generateAssetsKey(asset.id));
      arr.push(JSON.stringify(asset));
    }
    this.sessionData.setHashValues(generateUserAssetKey(userProfile.identity), arr);
  }

  deleteAsset(userProfile: UserProfile, id: string): void {
    this.sessionData.deleteHashValue(generateUserAssetKey(userProfile.identity),
      generateAssetsKey(id), (result: boolean) => {
        if (!result) {
          console.log("failed to remove asset", id);
        }
      });
  }
}
