export class Endpoint {
  readonly host: string;
  readonly path: string;
  readonly headers: { [key: string]: any };
  readonly lastSyncedThreads: { [key: string]: Date }
  readonly lastSyncedBooksMine: { [key: string]: Date }
  readonly lastSyncedBooksShared: { [key: string]: Date }
  readonly lastSyncedActivityEvents: { [key: string]: Date }
  readonly lastSyncedModules: { [key: string]: Date }

  constructor(raw: { [key: string]: any }) {
    this.host = raw.host;
    this.path = raw.path ? (raw.path.endsWith("/") ? raw.path : raw.path + "/") : '/';
    this.headers = raw.headers;
    this.lastSyncedBooksMine = {};
    this.lastSyncedBooksShared = {};
    this.lastSyncedThreads = {};
    this.lastSyncedActivityEvents = {};
    this.lastSyncedModules = {};
  }

  toObject(urlPrefix: string = ""): { [key: string]: any } {
    return {
      host: this.host,
      path: this.path,
      headers: this.headers,
      lastSyncedThreads: this.lastSyncedThreads,
      lastSyncedBooksMine: this.lastSyncedBooksMine,
      lastSyncedBooksShared: this.lastSyncedBooksMine,
      lastSyncedActivityEvents: this.lastSyncedActivityEvents,
      lastSyncedModules: this.lastSyncedModules
    };
  }
}
