import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL_EXTENSION, PREFIX_PEBL_THREAD } from "../utils/constants";

export class Reference extends XApiStatement {
  readonly thread: string;
  readonly book: string;
  readonly docType: string;
  readonly location: string;
  readonly card: string;
  readonly url: string;
  readonly target: string;
  readonly name: string;
  readonly externalURL: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);
    let object = this.object as ActivityObject;
    this.thread = object.id;
    if (this.thread.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.thread = this.thread.substring(PREFIX_PEBL_THREAD.length);

    if (!object.definition)
      object.definition = {};
    if (!object.definition.name)
      object.definition.name = {};
    if (!object.definition.extensions)
      object.definition.extensions = {};

    this.name = object.definition.name["en-US"];

    let extensions = object.definition.extensions;

    this.book = extensions[PREFIX_PEBL_EXTENSION + "book"];
    this.docType = extensions[PREFIX_PEBL_EXTENSION + "docType"];
    this.location = extensions[PREFIX_PEBL_EXTENSION + "location"];
    this.card = extensions[PREFIX_PEBL_EXTENSION + "card"];
    this.url = extensions[PREFIX_PEBL_EXTENSION + "url"];
    this.target = extensions[PREFIX_PEBL_EXTENSION + "target"];
    this.externalURL = extensions[PREFIX_PEBL_EXTENSION + "externalURL"];
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "pushed") || (verb == "pulled");
  }
}