import { XApiStatement } from "./xapiStatement";

export class ProgramAction extends XApiStatement {
  readonly thread: string;
  readonly programId: string;
  readonly action: string;
  readonly previousValue?: any;
  readonly newValue?: any;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    this.thread = this.object.id;

    let extensions = this.object.definition.extensions;

    this.programId = this.object.definition.name["en-US"];
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
