import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL, PREFIX_PEBL_THREAD } from "../utils/constants";

export class Session extends XApiStatement {

  readonly activityId: string;
  readonly book: string;
  readonly activityName?: string;
  readonly activityDescription?: string;

  readonly type: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;


    this.activityId = object.id;
    if (object.definition) {
      this.activityName = object.definition.name && object.definition.name["en-US"];
      this.activityDescription = object.definition.description && object.definition.description["en-US"];
    }

    this.book = object.id;
    if (this.book.indexOf(PREFIX_PEBL) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
    else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);

    this.type = this.verb.display["en-US"];
  }

  static replaceInvalidJson(x: Session): Session {
    return new Session(XApiStatement.replaceInvalidJson(x));
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "entered") || (verb == "exited") || (verb == "logged-in") ||
      (verb == "logged-out") || (verb == "terminated") || (verb == "initialized") || (verb == "launched");
  }
}