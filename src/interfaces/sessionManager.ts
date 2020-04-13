import { PeBLPlugin } from "../models/peblPlugin";
import { Session } from "../models/session";

export interface SessionManager extends PeBLPlugin {

  validateGetSessions(payload: { [key: string]: any }): boolean;
  validateSaveSessions(payload: { [key: string]: any }): boolean;
  validateDeleteSession(payload: { [key: string]: any }): boolean;

  getSessions(identity: string, callback: ((events: Session[]) => void)): void;
  saveSessions(identity: string, events: Session[]): void;
  deleteSession(identity: string, id: string): void;
}