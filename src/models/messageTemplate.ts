export class MessageTemplate {
  verb: string;
  validate: (payload: { [key: string]: any }) => boolean;
  authorize: (username: string, permissions: any, payload: { [key: string]: any }) => boolean;
  action: (payload: { [key: string]: any }) => void;

  constructor(verb: string,
    validate: (payload: { [key: string]: any }) => boolean,
    authorize: (username: string, permissions: any, payload: { [key: string]: any }) => boolean,
    action: (payload: { [key: string]: any }) => void) {

    this.verb = verb;
    this.validate = validate;
    this.action = action;
    this.authorize = authorize;
  }
}
