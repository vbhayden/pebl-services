import { PeBLPlugin } from "../models/peblPlugin";
import { ReferenceManager } from "../interfaces/referenceManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Reference } from "../models/reference";
import { generateUserReferencesKey, generateReferencesKey, generateTimestampForReference } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { Voided } from "../models/xapiStatement";

export class DefaultReferenceManager extends PeBLPlugin implements ReferenceManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getReferences",
      this.validateGetReferences.bind(this),
      this.authorizeGetReferences.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getReferences(payload.identity, payload.timestamp, dispatchCallback);
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
    return true;
  }

  authorizeGetReferences(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return true;
  }

  validateSaveReferences(payload: { [key: string]: any }): boolean {
    //TODO
    return true;
  }

  authorizeSaveReferences(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return true;
  }

  validateDeleteReference(payload: { [key: string]: any }): boolean {
    //TODO
    return true;
  }

  authorizeDeleteReference(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return true;
  }

  getReferences(identity: string, timestamp: number, callback: (data: { [key: string]: any }) => void): void {
    this.sessionData.getValuesGreaterThanTimestamp(generateTimestampForReference(identity), timestamp, (data) => {
      this.sessionData.getHashMultiField(generateUserReferencesKey(identity), data.map((x) => generateReferencesKey(x)), (result) => {
        callback(result.map(function(x) {
          let obj = JSON.parse(x);
          if (Reference.is(obj))
            return new Reference(obj);
          else
            return new Voided(obj);
        }));
      });
    });
  }

  saveReferences(identity: string, references: Reference[], callback: ((success: boolean) => void)): void {
    let arr = [];
    let date = new Date();
    for (let stmt of references) {
      stmt.stored = date.toISOString();
      let stmtStr = JSON.stringify(stmt);
      arr.push(generateReferencesKey(stmt.id));
      arr.push(stmtStr);
      this.sessionData.queueForLrs(stmtStr);
      this.sessionData.addTimestampValue(generateTimestampForReference(identity), date.getTime(), stmt.id);
    }
    this.sessionData.setHashValues(generateUserReferencesKey(identity), arr);
    callback(true);
  }

  deleteReference(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserReferencesKey(identity), generateReferencesKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
        let voided = new Reference(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue(generateTimestampForReference(identity), new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValues(generateUserReferencesKey(identity), [generateReferencesKey(voided.id), JSON.stringify(voided)]);
      }
      this.sessionData.deleteSortedTimestampMember(generateTimestampForReference(identity),
        id,
        (deleted: number) => {
          this.sessionData.deleteHashValue(generateUserReferencesKey(identity),
            generateReferencesKey(id), (result: boolean) => {
              if (!result) {
                console.log("failed to remove refernce", id);
              }
              callback(result);
            });
        });
    });
  }
}
