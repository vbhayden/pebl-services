import { XApiStatement } from "./xapiStatement";
import { PREFIX_PEBL, PREFIX_PEBL_THREAD, PREFIX_PEBL_EXTENSION } from "../utils/constants";

export class Annotation extends XApiStatement {
  readonly book: string;
  readonly type: string;
  readonly cfi: string;
  readonly idRef: string;
  readonly title: string;
  readonly style: string;
  readonly text?: string;
  readonly owner: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    this.title = this.object.definition.name && this.object.definition.name["en-US"];
    this.text = this.object.definition.description && this.object.definition.description["en-US"];

    this.book = this.object.id;
    if (this.book.indexOf(PREFIX_PEBL) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL) + PREFIX_PEBL.length);
    else if (this.book.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.book = this.book.substring(this.book.indexOf(PREFIX_PEBL_THREAD) + PREFIX_PEBL_THREAD.length);

    this.owner = this.getActorId();

    let extensions = this.object.definition.extensions;

    this.type = extensions[PREFIX_PEBL_EXTENSION + "type"];
    this.cfi = extensions[PREFIX_PEBL_EXTENSION + "cfi"];
    this.idRef = extensions[PREFIX_PEBL_EXTENSION + "idRef"];
    this.style = extensions[PREFIX_PEBL_EXTENSION + "style"];
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "commented") || (verb == "bookmarked") || (verb == "annotated");
  }
}
