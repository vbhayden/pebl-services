import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { SessionManager } from "../interfaces/sessionManager";
import { Session } from "../models/session";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";

export class DefaultSessionManager extends PeBLPlugin implements SessionManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;

    // this.addMessageTemplate(new MessageTemplate("getSessions",
    //   this.validateGetSessions.bind(this),
    //   this.authorizeGetSessions.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.getSessions(payload.identity, dispatchCallback);
    //   }));

    this.addMessageTemplate(new MessageTemplate("saveSessions",
      this.validateSaveSessions.bind(this),
      this.authorizeSaveSessions.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveSessions(payload.identity, payload.sessions, dispatchCallback);
      }));

    // this.addMessageTemplate(new MessageTemplate("deleteSession",
    //   this.validateDeleteSession.bind(this),
    //   this.authorizeDeleteSession.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.deleteSession(payload.identity, payload.xId, dispatchCallback);
    //   }));
  }

  // validateGetSessions(payload: { [key: string]: any }): boolean {
  //   return false;
  // }

  // authorizeGetSessions(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   return false;
  // }

  validateSaveSessions(payload: { [key: string]: any }): boolean {
    if (payload.sessions && (payload.sessions instanceof Array) && (payload.sessions.length > 0)) {
      for (let sessionIndex in payload.sessions) {
        let session = payload.sessions[sessionIndex];
        if (Session.is(session)) {
          payload.sessions[sessionIndex] = new Session(session);
        } else {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  authorizeSaveSessions(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    if (permissions.user[payload.requestType]) {
      for (let key in payload.actions) {
        let obj = payload.actions[key];
        let identity = (<Session>obj).getActorId();
        let canUser = (username == identity);
        // let canGroup = permissions.group[identity] && permissions.group[identity][obj.requestType]

        if (!(canUser // || canGroup
        ))
          return false;
      }
    }

    return true;
  }

  // validateDeleteSession(payload: { [key: string]: any }): boolean {
  //   return false;
  // }

  // authorizeDeleteSession(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   return false;
  // }

  // getSessions(identity: string, callback: ((sessions: Session[]) => void)): void {
  //   this.sessionData.getHashValues(generateUserSessionsKey(identity),
  //     (result: string[]) => {
  //       callback(result.map(function(x) {
  //         return new Session(JSON.parse(x));
  //       }));
  //     });
  // }

  saveSessions(identity: string, sessions: Session[], callback: ((success: boolean) => void)): void {
    for (let session of sessions) {
      this.sessionData.queueForLrs(JSON.stringify(session));
    }
    callback(true);
  }

  // deleteSession(identity: string, id: string, callback: ((success: boolean) => void)): void {
  //   this.sessionData.getHashValue(generateUserSessionsKey(identity), generateSessionsKey(id), (data) => {
  //     if (data) {
  //       this.sessionData.queueForLrsVoid(data);
  //     }
  //     this.sessionData.deleteHashValue(generateUserSessionsKey(identity),
  //       generateSessionsKey(id), (result: boolean) => {
  //         if (!result) {
  //           auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelMembershipFail", identity, id);
  //         }
  //         callback(result);
  //       });
  //   });
  // }
}
