
export class ServiceMessage {
  //TODO
  readonly identity: string;
  readonly sessionId?: string;

  readonly payload: {
    [key: string]: any
  };
  messageId?: string;

  constructor(identity: string,
    payload: { [key: string]: any },
    sessionId?: string,
    messageId?: string) {

    this.identity = identity;
    this.payload = payload;
    this.sessionId = sessionId;
    this.messageId = messageId;
  }

  getRequestType(): string {
    return this.payload.requestType;
  }

  static parse(data: string): ServiceMessage {
    let o = JSON.parse(data);
    return new ServiceMessage(o.identity, o.payload, o.sessionId, o.messageId);
  }

}
