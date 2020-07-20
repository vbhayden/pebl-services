import { XApiStatement } from "./xapiStatement";
import { PREFIX_PEBL, PREFIX_PEBL_THREAD, PREFIX_PEBL_EXTENSION } from "../utils/constants";
import { ActivityObject } from "./xapiStatement"

export class Annotation extends XApiStatement {
  readonly book: string;
  readonly type: string;
  readonly cfi: string;
  readonly idRef: string;
  readonly title: string;
  readonly style: string;
  readonly text?: string;
  readonly owner: string | string[];
  pinned?: boolean;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {};

    this.title = (object.definition.name && object.definition.name["en-US"]) || "";
    this.text = object.definition.description && object.definition.description["en-US"];

    this.book = object.id;
    if (this.book.indexOf(PREFIX_PEBL) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
    else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);

    this.owner = this.getActorId();

    if (!object.definition.extensions)
      object.definition.extensions = {};
    let extensions = object.definition.extensions;

    this.type = extensions[PREFIX_PEBL_EXTENSION + "type"];
    this.cfi = extensions[PREFIX_PEBL_EXTENSION + "cfi"];
    this.idRef = extensions[PREFIX_PEBL_EXTENSION + "idRef"];
    this.style = extensions[PREFIX_PEBL_EXTENSION + "style"];
    this.pinned = raw.pinned;
    if (extensions[PREFIX_PEBL_EXTENSION + "bookId"])
      this.book = extensions[PREFIX_PEBL_EXTENSION + "bookId"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "commented") || (verb == "bookmarked") || (verb == "annotated");
  }
}
