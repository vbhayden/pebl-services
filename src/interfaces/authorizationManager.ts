import { PermissionSet } from "../models/permission";

export interface AuthorizationManager {
  authorize(username: string,
    permissions: any,
    payload: { [key: string]: any }): boolean;

  assemblePermissionSet(identity: string,
    session: Express.Session,
    callback: (permissions?: PermissionSet) => void): void;
}

