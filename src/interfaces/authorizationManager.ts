
export interface AuthorizationManager {
  authorize(username: string,
    permissions: any,
    payload: { [key: string]: any }): boolean;

  assemblePermissionSet(identity: string,
    permissionLastModified: Express.Session,
    callback: () => void): void;
}

