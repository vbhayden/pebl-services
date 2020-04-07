
export interface AuthorizationManager {
  authorized(data: { [key: string]: any },
    successCallback: (() => void),
    failureCallback: ((err: string) => void)): void;
}
