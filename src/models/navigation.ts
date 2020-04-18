import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL_EXTENSION, PREFIX_PEBL, PREFIX_PEBL_THREAD } from "../utils/constants";

export class Navigation extends XApiStatement {
  readonly activityId: string;
  readonly book: string;
  readonly firstCfi?: string;
  readonly lastCfi?: string;

  readonly type: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);
    this.type = this.verb.display["en-US"];

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {};

    this.activityId = object.id;

    this.book = object.id;
    if (this.book.indexOf(PREFIX_PEBL) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
    else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);

    let extensions = object.definition.extensions;

    if (extensions) {
      this.firstCfi = extensions[PREFIX_PEBL_EXTENSION + "firstCfi"];
      this.lastCfi = extensions[PREFIX_PEBL_EXTENSION + "lastCfi"];
    }
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "paged-next") || (verb == "paged-prev") || (verb == "paged-jump") || (verb == "interacted") ||
      (verb == "completed");
  }
}