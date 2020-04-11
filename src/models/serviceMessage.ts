
export class ServiceMessage {
  //TODO
  readonly identity?: string;
  readonly sessionId?: string;
  payload: {
    requestType: string,
    identity?: string,
    [key: string]: any
  };
  messageId?: string;
  messageTimeout?: number;

  constructor(raw: { [key: string]: any }) {
    this.identity = raw.identity;
    this.sessionId = raw.sessionId;
    this.payload = raw.payload;
    this.messageId = raw.messageId;
    this.messageTimeout = raw.messageTimeout;
  }
}
