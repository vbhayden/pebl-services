import { PeblData } from '../models/peblData';

export class XApiStatement {
  identity?: string;
  readonly id: string;
  readonly "object": { [key: string]: any };
  readonly actor: { [key: string]: any };
  readonly verb: { [key: string]: any };
  readonly context: { [key: string]: any };
  readonly result: { [key: string]: any };
  readonly attachments: { [key: string]: any }[];
  readonly stored: string;
  readonly timestamp: string;

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
    this.actor = raw.actor;
    this.verb = raw.verb;
    this.context = raw.context;
    this.stored = raw.stored;
    this.timestamp = raw.timestamp;
    this.result = raw.result;
    this["object"] = raw.object;
    this.attachments = raw.attachments;
  }

  toXAPI(): XApiStatement {
    return new XApiStatement(this);
  }

  getActorId(): string {
    return this.actor.mbox || this.actor.openid ||
      (this.actor.account && this.actor.account.name);
  }

  static is(x: any): boolean {
    if (x.verb)
      return true;
    else
      return false;
  }

  static peblToXapi(data: PeblData): XApiStatement {
    //TODO
    return new XApiStatement({});
  }

  static xApiToPebl(data: XApiStatement): PeblData {
    //TODO
    return new PeblData({});
  }
}
