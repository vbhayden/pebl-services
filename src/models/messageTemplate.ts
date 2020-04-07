export class MessageTemplate {
  verb: string
  [key: string]: string

  constructor(verb: string, fields: { [key: string]: string }) {
    this.verb = verb;
    for (let key in fields) {
      this[key] = fields[key];
    }
  }
}
