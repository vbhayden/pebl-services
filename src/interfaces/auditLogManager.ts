export interface AuditLogManager {
  info(infoMessage: string, ...data: any[] | { [key: string]: any }[] | string[]): void;
  error(errorMessage: string, ...data: any[] | { [key: string]: any }[] | string[]): void;
  debug(debugMessage: string, ...data: any[] | { [key: string]: any }[] | string[]): void;
  setDebug(debug?: boolean): void;
  flush(): void;
}
