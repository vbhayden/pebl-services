import { XApiStatement } from "./xapiStatement";

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

    this.thread = this.object.id;
    if (this.thread.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.thread = this.thread.substring(PREFIX_PEBL_THREAD.length);

    this.membershipId = this.object.definition.name["en-US"];
    this.description = this.object.definition.description && this.object.definition.description["en-US"];

    let extensions = this.object.definition.extensions;

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
