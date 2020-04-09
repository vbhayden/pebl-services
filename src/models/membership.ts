import { XApiStatement } from "./xapiStatement";
import { PREFIX_PEBL_THREAD, PREFIX_PEBL_EXTENSION } from "../utils/constants";
import { ActivityObject } from "./xapiStatement";

export class Membership extends XApiStatement {

  readonly thread: string;
  readonly membershipId: string;
  readonly activityType: string;
  readonly description?: string;
  readonly role: string;
  readonly organization?: string;
  readonly organizationName?: string;

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
    this.membershipId = object.definition.name["en-US"];
    this.description = object.definition.description && object.definition.description["en-US"];

    if (!object.definition.extensions)
      object.definition.extensions = {};
    let extensions = object.definition.extensions;

    this.role = extensions[PREFIX_PEBL_EXTENSION + "role"];
    this.activityType = extensions[PREFIX_PEBL_EXTENSION + "activityType"];
    this.organization = extensions[PREFIX_PEBL_EXTENSION + "organization"];
    this.organizationName = extensions[PREFIX_PEBL_EXTENSION + "organizationName"];
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "joined");
  }
}
