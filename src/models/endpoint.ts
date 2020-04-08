export class Endpoint {
  readonly url: string;
  readonly headers: { [key: string]: any };
  readonly lastSyncedThreads: { [key: string]: Date }
  readonly lastSyncedBooksMine: { [key: string]: Date }
  readonly lastSyncedBooksShared: { [key: string]: Date }
  readonly lastSyncedActivityEvents: { [key: string]: Date }
  readonly lastSyncedModules: { [key: string]: Date }

  constructor(raw: { [key: string]: any }) {
    this.url = raw.url;
    this.headers = raw.headers;

    this.lastSyncedBooksMine = {};
    this.lastSyncedBooksShared = {};
    this.lastSyncedThreads = {};
    this.lastSyncedActivityEvents = {};
    this.lastSyncedModules = {};
  }

  toObject(urlPrefix: string = ""): { [key: string]: any } {
    return {
      url: this.url,
      headers: this.headers,
      lastSyncedThreads: this.lastSyncedThreads,
      lastSyncedBooksMine: this.lastSyncedBooksMine,
      lastSyncedBooksShared: this.lastSyncedBooksMine,
      lastSyncedActivityEvents: this.lastSyncedActivityEvents,
      lastSyncedModules: this.lastSyncedModules
    };
  }
}
