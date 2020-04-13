import { Voided } from './voided';

class Verb {
  id: string;
  display: { [key: string]: string };

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
    this.display = raw.display;
  }
}

class AgentObject {
  objectType: string;
  name?: string;
  mbox?: string;
  mbox_sha1sum?: string;
  openid?: string;
  account?: {
    homePage: string,
    name: string
  }

  constructor(raw: { [key: string]: any }) {
    this.objectType = "Agent";
    this.name = raw.name;
    this.mbox = raw.mbox;
    this.mbox_sha1sum = raw.mbox_sha1sum;
    this.openid = raw.openid;
    this.account = raw.account;
  }

  static is(x: any) {
    if (x && x.objectType && x.objectType === "Agent")
      return true;
    else
      return false;
  }
}

class GroupObject {
  objectType: string;
  member: AgentObject[];
  name?: string;

  constructor(raw: { [key: string]: any }) {
    this.objectType = "Group";
    this.member = raw.member;
    this.name = raw.name;
  }

  static is(x: any) {
    if (x && x.objectType && x.objectType === "Group")
      return true;
    else
      return false;
  }
}

class StatementRefObject {
  objectType: string;
  id: string;

  constructor(raw: { [key: string]: any }) {
    this.objectType = "StatementRef";
    this.id = raw.id;
  }

  static is(x: any) {
    if (x && x.objectType && x.objectType === "StatementRef")
      return true;
    else
      return false;
  }
}

class SubStatementObject {
  objectType: string;
  "object": ActivityObject | AgentObject | GroupObject | StatementRefObject;
  actor: AgentObject | GroupObject;
  verb: Verb;
  context?: {
    registration?: string, // UUID of registration the the statement is associated with.
    instructor?: AgentObject, //Instructor that the Statement relates to, if not included as the Actor of the Statement.
    team?: GroupObject, //Team that this Statement relates to, if not included as the Actor of the Statement.
    contextActivities?: {
      parent?: ActivityObject[],
      grouping?: ActivityObject[],
      category?: ActivityObject[],
      other?: ActivityObject[]
    }
  };
  result: {
    score?: {
      scaled?: number,
      raw?: number,
      min?: number,
      max?: number
    },
    success?: boolean,
    completion?: boolean,
    response?: string,
    duration?: string,
    extensions?: { [key: string]: any }
  };
  attachments: Attachment[];

  constructor(raw: { [key: string]: any }) {
    this.objectType = "SubStatement";
    this.object = raw.object;
    this.actor = raw.actor;
    this.verb = raw.verb;
    this.result = raw.result;
    this.attachments = raw.attachments;
  }

  static is(x: any) {
    if (x && x.objectType && x.objectType === "SubStatement")
      return true;
    else
      return false;
  }
}

class InteractionComponent {
  id: string;
  description?: { [key: string]: string };

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
    this.description = raw.description;
  }
}

export class ActivityObject {
  objectType: string;
  id: string;
  definition?: {
    name?: { [key: string]: string },
    description?: { [key: string]: string },
    type?: string,
    moreInfo?: string,
    extensions?: { [key: string]: any },
    interactionType?: string,
    correctResponsePattern?: string[],
    choices?: InteractionComponent[],
    scale?: InteractionComponent[],
    source?: InteractionComponent[],
    target?: InteractionComponent[],
    steps?: InteractionComponent[]
  }

  constructor(raw: { [key: string]: any }) {
    this.objectType = "Activity";
    this.id = raw.id;
    this.definition = raw.definition;
  }

  static is(x: any) {
    if (x && x.objectType && x.objectType === "Activity")
      return true;
    else
      return false;
  }
}

class Attachment {
  usageType: string;
  display: { [key: string]: string };
  description?: { [key: string]: string };
  contentType: string;
  length: number;
  sha2: string;
  fileUrl?: string;

  constructor(raw: { [key: string]: any }) {
    this.usageType = raw.usageType;
    this.display = raw.display;
    this.description = raw.description;
    this.contentType = raw.contentType;
    this.length = raw.length;
    this.sha2 = raw.sha2;
    this.fileUrl = raw.fileUrl;
  }
}

export class XApiStatement {
  identity?: string;
  readonly id: string;
  readonly "object": ActivityObject | AgentObject | GroupObject | StatementRefObject | SubStatementObject;
  readonly actor: AgentObject | GroupObject;
  readonly verb: Verb;
  readonly context?: {
    registration?: string, // UUID of registration the the statement is associated with.
    instructor?: AgentObject, //Instructor that the Statement relates to, if not included as the Actor of the Statement.
    team?: GroupObject, //Team that this Statement relates to, if not included as the Actor of the Statement.
    contextActivities?: {
      parent?: ActivityObject[],
      grouping?: ActivityObject[],
      category?: ActivityObject[],
      other?: ActivityObject[]
    }
  };
  readonly result: {
    score?: {
      scaled?: number,
      raw?: number,
      min?: number,
      max?: number
    },
    success?: boolean,
    completion?: boolean,
    response?: string,
    duration?: string,
    extensions?: { [key: string]: any }
  };
  readonly attachments: Attachment[];
  readonly stored: string;
  readonly timestamp: string;

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
    this.actor = raw.actor;
    this.verb = raw.verb;
    this.context = raw.context;
    this.stored = raw.stored;
    this.timestamp = raw.timestamp;
    this.result = raw.result;
    this["object"] = raw.object;
    this.attachments = raw.attachments;
  }

  toXAPI(): XApiStatement {
    return new XApiStatement(this);
  }

  toVoidRecord(): Voided {
    let o = {
      "actor": this.actor,
      "verb": {
        "display": {
          "en-US": "voided"
        },
        "id": "http://adlnet.gov/expapi/verbs/voided"
      },
      "object": {
        "id": this.id,
        "objectType": "StatementRef"
      },
      "stored": this.stored,
      "timestamp": this.timestamp,
      "id": "v-" + this.id
    };

    return new Voided(o);
  }

  getActorId(): string | string[] {
    if (AgentObject.is(this.actor)) {
      let actor = this.actor as AgentObject;
      return actor.mbox || actor.openid ||
        (actor.account && actor.account.name) || "";
    } else {
      let actor = this.actor as GroupObject;
      return actor.member.map((member) => {
        let actor = this.actor as AgentObject;
        return actor.mbox || actor.openid ||
          (actor.account && actor.account.name) || "";
      });
    }
  }

  static is(x: any): boolean {
    if (x.verb)
      return true;
    else
      return false;
  }
}
