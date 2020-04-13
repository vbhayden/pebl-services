
export interface AuthorizationManager {
  authorize(username: string,
    permissions: any,
    payload: { [key: string]: any }): boolean;

  assemblePermissionSet(identity: string, callback: (permissions: { [key: string]: any }) => void): void;
}

