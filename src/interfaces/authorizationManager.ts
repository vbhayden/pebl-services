
export interface AuthorizationManager {
  authorized(username: string,
    data: { [key: string]: any },
    successCallback: (() => void),
    failureCallback: ((err: string) => void)): void;
}
