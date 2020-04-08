import { UserProfile } from "./userProfile";

export class ServiceMessage {
  //TODO
  readonly userProfile?: UserProfile;
  readonly sessionId?: string;
  payload: {
    requestType: string,
    [key: string]: any
  };
  messageId?: string;
  messageTimeout?: number;

  constructor(raw: { [key: string]: any }) {
    this.userProfile = raw.userProfile;
    this.sessionId = raw.sessionId;
    this.payload = raw.payload;
    this.messageId = raw.messageId;
    this.messageTimeout = raw.messageTimeout;
  }
}
