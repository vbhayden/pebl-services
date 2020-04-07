export class MessageTemplate {
  verb: string;
  validate: (payload: { [key: string]: any }) => boolean;
  action: (payload: { [key: string]: any }, callback?: ((data: any) => void)) => void;

  constructor(verb: string,
    validate: (payload: { [key: string]: any }) => boolean,
    action: (payload: { [key: string]: any }, callback?: ((data: any) => void)) => void) {

    this.verb = verb;
    this.validate = validate;
    this.action = action;
  }
}
