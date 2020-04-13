import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { AssetManager } from "../interfaces/assetManager";
import { Asset } from "../models/asset";
import { generateUserAssetKey, generateAssetsKey } from "../utils/constants";

export class DefaultAssetManager extends PeBLPlugin implements AssetManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    // this.addMessageTemplate(new MessageTemplate("getAssets",
    //   this.validateGetAssets,
    //   (payload: { [key: string]: any }) => {
    //     this.getAssets(payload.identity, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveAssets",
    //   this.validateSaveAssets,
    //   (payload: { [key: string]: any }) => {
    //     this.saveAssets(payload.identity, payload.assets);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("deleteAsset",
    //   this.validateDeleteAsset,
    //   (payload: { [key: string]: any }) => {
    //     this.deleteAsset(payload.identity, payload.xId);
    //   }));
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

  getAssets(identity: string, callback: ((assets: Asset[]) => void)): void {
    this.sessionData.getHashValues(generateUserAssetKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Asset(JSON.parse(x));
        }));
      });
  }

  saveAssets(identity: string, assets: Asset[]): void {
    let arr = [];
    for (let asset of assets) {
      arr.push(generateAssetsKey(asset.id));
      arr.push(JSON.stringify(asset));
    }
    this.sessionData.setHashValues(generateUserAssetKey(identity), arr);
  }

  deleteAsset(identity: string, id: string): void {
    this.sessionData.getHashValue(generateUserAssetKey(identity), generateAssetsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserAssetKey(identity),
        generateAssetsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove asset", id);
          }
        });
    });
  }
}
