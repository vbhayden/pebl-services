export class DefaultAuditLogManager {

  private infoBuffer: string[];
  private errorBuffer: string[];
  private debugBuffer: string[];
  debugging: boolean;
  private infoWriteOutHandler?: NodeJS.Timeout;
  private errorWriteOutHandler?: NodeJS.Timeout;
  private debugWriteOutHandler?: NodeJS.Timeout;

  private readonly MAX_BUFFER_ENTRIES = 3000;
  private readonly TIMEOUT_FLUSH = 20 * 1000;

  constructor(debugging?: boolean) {
    this.debugging = debugging ? debugging : false;
    this.infoBuffer = [];
    this.errorBuffer = [];
    this.debugBuffer = [];
  }

  setDebug(debug?: boolean): void {
    this.debugging = debug ? debug : false;
  }

  info(infoMessage: string, ...data: any[] | { [key: string]: any }[] | string[]): void {
    this.infoBuffer.push("INFO:::" + new Date().toISOString() + ":::" + infoMessage + ":::" + JSON.stringify(data));
    if (this.infoWriteOutHandler) {
      clearTimeout(this.infoWriteOutHandler);
    }
    if (this.infoBuffer.length > this.MAX_BUFFER_ENTRIES) {
      this.flushInfos();
    } else {
      this.infoWriteOutHandler = setTimeout(this.flushInfos.bind(this),
        this.TIMEOUT_FLUSH);
    }
  }

  error(errorMessage: string, ...data: any[] | { [key: string]: any }[] | string[]): void {
    this.errorBuffer.push("ERROR:::" + new Date().toISOString() + ":::" + errorMessage + ":::" + JSON.stringify(data));
    if (this.errorWriteOutHandler) {
      clearTimeout(this.errorWriteOutHandler);
    }
    if (this.errorBuffer.length > this.MAX_BUFFER_ENTRIES) {
      this.flushErrors();
    } else {
      this.errorWriteOutHandler = setTimeout(this.flushErrors.bind(this),
        this.TIMEOUT_FLUSH);
    }
  }

  debug(debugMessage: string, ...data: any[] | { [key: string]: any }[] | string[]): void {
    if (this.debugging) {
      this.debugBuffer.push("DEBUG:::" + new Date().toISOString() + ":::" + debugMessage + ":::" + JSON.stringify(data));
      if (this.debugWriteOutHandler) {
        clearTimeout(this.debugWriteOutHandler);
      }
      if (this.debugBuffer.length > this.MAX_BUFFER_ENTRIES) {
        this.flushErrors();
      } else {
        this.debugWriteOutHandler = setTimeout(this.flushDebugs.bind(this),
          this.TIMEOUT_FLUSH);
      }
    }
  }

  private flushErrors(): void {
    console.error(this.errorBuffer.join("\n"));
    this.errorBuffer = [];
  }

  private flushInfos(): void {
    console.log(this.infoBuffer.join("\n"));
    this.infoBuffer = [];
  }

  private flushDebugs(): void {
    if (this.debugging) {
      console.log(this.debugBuffer.join("\n"));
      this.debugBuffer = [];
    }
  }

  flush(): void {
    this.flushErrors();
    this.flushInfos();
    this.flushDebugs();
  }
}
