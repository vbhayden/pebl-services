import { XApiStatement } from "./xapiStatement";
import { PREFIX_PEBL_THREAD } from "../utils/constants";
import { ActivityObject } from "./xapiStatement";

export class Voided extends XApiStatement {
  readonly thread: string;
  readonly target: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);
    this.thread = (this.context && this.context.contextActivities && this.context.contextActivities.parent) ? this.context.contextActivities.parent[0].id : "";
    if (this.thread.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.thread = this.thread.substring(PREFIX_PEBL_THREAD.length);

    let object = this.object as ActivityObject;
    this.target = object.id;
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "voided");
  }
}
