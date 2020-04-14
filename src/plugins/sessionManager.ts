import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { SessionManager } from "../interfaces/sessionManager";
import { Session } from "../models/session";
import { generateUserSessionsKey, generateSessionsKey } from "../utils/constants";

export class DefaultSessionManager extends PeBLPlugin implements SessionManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;

    // this.addMessageTemplate(new MessageTemplate("getSessions",
    //   this.validateGetSessions,
    //   (payload) => {
    //     this.getSessions(payload.identity, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveSessions",
    //   this.validateSaveSessions,
    //   (payload) => {
    //     this.saveSessions(payload.identity, payload.sessions, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("deleteSession",
    //   this.validateDeleteSession,
    //   (payload) => {
    //     this.deleteSession(payload.identity, payload.xId, payload.callback);
    //   }));
  }

  validateGetSessions(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveSessions(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteSession(payload: { [key: string]: any }): boolean {
    return false;
  }

  getSessions(identity: string, callback: ((sessions: Session[]) => void)): void {
    this.sessionData.getHashValues(generateUserSessionsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Session(JSON.parse(x));
        }));
      });
  }

  saveSessions(identity: string, sessions: Session[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let session of sessions) {
      let sessionStr = JSON.stringify(session);
      arr.push(generateSessionsKey(session.id));
      arr.push(sessionStr);
      this.sessionData.queueForLrs(sessionStr);
    }
    this.sessionData.setHashValues(generateUserSessionsKey(identity), arr);
    callback(true);
  }

  deleteSession(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserSessionsKey(identity), generateSessionsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserSessionsKey(identity),
        generateSessionsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove membership", id);
          }
          callback(result);
        });
    });
  }
}
