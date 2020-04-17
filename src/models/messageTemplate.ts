export class MessageTemplate {
  readonly verb: string;
  readonly validate: (payload: { [key: string]: any }) => boolean;
  readonly authorize: (username: string, permissions: any, payload: { [key: string]: any }) => boolean;
  readonly action: (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => void;

  constructor(verb: string,
    validate: (payload: { [key: string]: any }) => boolean,
    authorize: (username: string, permissions: any, payload: { [key: string]: any }) => boolean,
    action: (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => void) {

    this.verb = verb;
    this.validate = validate;
    this.action = action;
    this.authorize = authorize;
  }
}
