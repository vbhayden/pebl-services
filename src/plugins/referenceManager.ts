import { PeBLPlugin } from "../models/peblPlugin";
import { ReferenceManager } from "../interfaces/referenceManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Reference } from "../models/reference";
import { generateUserReferencesKey, generateReferencesKey } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";

export class DefaultReferenceManager extends PeBLPlugin implements ReferenceManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getReferences",
      this.validateGetReferences.bind(this),
      this.authorizeGetReferences.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getReferences(payload.identity, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveReferences",
      this.validateSaveReferences.bind(this),
      this.authorizeSaveReferences.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveReferences(payload.identity, payload.references, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteReference",
      this.validateDeleteReference.bind(this),
      this.authorizeDeleteReference.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteReference(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetReferences(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  authorizeGetReferences(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveReferences(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  authorizeSaveReferences(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteReference(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  authorizeDeleteReference(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  getReferences(identity: string, callback: ((references: Reference[]) => void)): void {
    this.sessionData.getHashValues(generateUserReferencesKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Reference(JSON.parse(x));
        }));
      });
  }

  saveReferences(identity: string, references: Reference[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let reference of references) {
      let referenceStr = JSON.stringify(reference);
      arr.push(generateReferencesKey(reference.id));
      arr.push(referenceStr);
      this.sessionData.queueForLrs(referenceStr);
    }
    this.sessionData.setHashValues(generateUserReferencesKey(identity), arr);
    callback(true);
  }

  deleteReference(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserReferencesKey(identity), generateReferencesKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserReferencesKey(identity),
        generateReferencesKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove reference", id);
          }
          callback(result);
        });
    });
  }
}
