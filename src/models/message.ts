import { XApiStatement } from "./xapiStatement";
import { PREFIX_PEBL_THREAD, PREFIX_PEBL_EXTENSION, NAMESPACE_USER_MESSAGES } from "../utils/constants";

export class Message extends XApiStatement {
  readonly thread: string;
  readonly text: string;
  readonly prompt: string;
  readonly name: string;
  readonly direct: boolean;
  readonly access?: "private" | "team" | "class" | "all";
  readonly type?: "written" | "table" | "checkboxes" | "radioboxes" | "buttons";
  readonly masterThread?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    this.thread = this.object.id;
    if (this.thread.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.thread = this.thread.substring(PREFIX_PEBL_THREAD.length);

    this.prompt = this.object.definition.name["en-US"];
    this.name = this.actor.name;
    this.direct = this.thread == (NAMESPACE_USER_MESSAGES + this.getActorId());
    this.text = this.object.definition.description["en-US"];

    let extensions = this.object.definition.extensions;
    if (extensions) {
      this.access = extensions[PREFIX_PEBL_EXTENSION + "access"];
      this.type = extensions[PREFIX_PEBL_EXTENSION + "type"];
      this.masterThread = extensions[PREFIX_PEBL_EXTENSION + "masterThread"];
    }
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "responded") || (verb == "noted");
  }
}
