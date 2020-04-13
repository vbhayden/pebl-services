import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL, PREFIX_PEBL_THREAD, PREFIX_PEBL_EXTENSION } from "../utils/constants";

export class Action extends XApiStatement {
  readonly activityId: string;
  readonly book: string;
  readonly target?: string;
  readonly idref?: string;
  readonly cfi?: string;
  readonly type?: string;
  readonly name?: string;
  readonly description?: string;
  readonly action: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);
    let object = this.object as ActivityObject;
    this.activityId = object.id;

    this.action = this.verb.display["en-US"];

    this.book = object.id;
    if (this.book.indexOf(PREFIX_PEBL) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
    else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);


    if (object.definition) {
      this.name = object.definition.name && object.definition.name["en-US"];
      this.description = object.definition.description && object.definition.description["en-US"];

      let extensions = object.definition.extensions;

      if (extensions) {
        this.target = extensions[PREFIX_PEBL_EXTENSION + "target"];
        this.type = extensions[PREFIX_PEBL_EXTENSION + "type"];
        this.idref = extensions[PREFIX_PEBL_EXTENSION + "idref"];
        this.cfi = extensions[PREFIX_PEBL_EXTENSION + "cfi"];
      }
    }
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "preferred") || (verb == "morphed") || (verb == "interacted") || (verb == "experienced") || (verb == "disliked") ||
      (verb == "liked") || (verb == "accessed") || (verb == "hid") || (verb == "showed") || (verb == "displayed") || (verb == "undisplayed") ||
      (verb == "searched") || (verb == "selected") || (verb == "unbookmarked") || (verb == "discarded") || (verb == "unshared") || (verb == "unannotated") ||
      (verb == "submitted");
  }
}