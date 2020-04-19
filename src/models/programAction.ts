import { XApiStatement } from "./xapiStatement";
import { PREFIX_PEBL_EXTENSION } from "../utils/constants";
import { ActivityObject } from "./xapiStatement";

export class ProgramAction extends XApiStatement {
  readonly thread: string;
  readonly programId: string;
  readonly action: string;
  readonly previousValue?: any;
  readonly newValue?: any;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    this.thread = object.id;

    if (!object.definition)
      object.definition = {};
    if (!object.definition.name)
      object.definition.name = {};
    if (!object.definition.extensions)
      object.definition.extensions = {};
    let extensions = object.definition.extensions;

    this.programId = object.definition.name["en-US"];
    this.previousValue = extensions[PREFIX_PEBL_EXTENSION + "previousValue"];
    this.newValue = extensions[PREFIX_PEBL_EXTENSION + "newValue"];
    this.action = extensions[PREFIX_PEBL_EXTENSION + "action"];

  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "programLevelUp") || (verb == "programLevelDown") || (verb == "programInvited") || (verb == "programUninvited")
      || (verb == "programExpelled") || (verb == "programJoined") || (verb == "programActivityLaunched")
      || (verb == "programActivityCompleted") || (verb == "programActivityTeamCompleted") || (verb == "programModified")
      || (verb == "programDeleted") || (verb == "programCompleted") || (verb == "programCopied") || (verb == "programDiscussed")
  }
}
