import { PREFIX_PEBL_THREAD } from "../utils/constants";
import { stringIsInvalidJson } from "../utils/utils";
class Verb {
  id: string;
  display: { [key: string]: string };

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
    this.display = raw.display;
  }

  static is(x: any): boolean {
    if (!x)
      return false;
    if (typeof x.id !== "string")
      return false;

    if (typeof x.display !== 'object' || x.display === null)
      return false;

    for (let string in x.display) {
      if (stringIsInvalidJson(string))
        return false;

      if (typeof x.display[string] !== "string")
        return false;

      if (stringIsInvalidJson(x.display[string]))
        return false;
    }

    return true;
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

  static is(x: any): boolean {
    if (!x)
      return false;

    if (typeof x.objectType !== "string" || x.objectType !== "Agent")
      return false;

    if (x.name && (typeof x.name !== "string" || stringIsInvalidJson(x.name)))
      return false;

    if (x.mbox && (typeof x.mbox !== "string" || stringIsInvalidJson(x.mbox)))
      return false;

    if (x.mbox_sha1sum && (typeof x.mbox_sha1sum !== "string" || stringIsInvalidJson(x.mbox_sha1sum)))
      return false;

    if (x.openid && (typeof x.openid !== "string" || stringIsInvalidJson(x.openid)))
      return false;

    if (x.account) {
      if (typeof x.account !== "object")
        return false;

      if (typeof x.account.homePage !== "string" || stringIsInvalidJson(x.account.homePage))
        return false;

      if (typeof x.account.name !== "string" || stringIsInvalidJson(x.account.name))
        return false;
    }

    return true;
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

  static is(x: any): boolean {
    if (!x)
      return false;

    if (typeof x.objectType !== "string" || x.objectType !== "Group")
      return false;

    if (!Array.isArray(x.member) || !x.member.every((m: any) => { return AgentObject.is(m) }))
      return false;

    if (x.name && (typeof x.name !== "string" || stringIsInvalidJson(x.name)))
      return false;

    return true;
  }
}

class StatementRefObject {
  objectType: string;
  id: string;

  constructor(raw: { [key: string]: any }) {
    this.objectType = "StatementRef";
    this.id = raw.id;
  }

  static is(x: any): boolean {
    if (!x)
      return false;

    if (typeof x.objectType !== "string" || x.objectType !== "StatementRef")
      return false;

    if (typeof x.id !== "string" || stringIsInvalidJson(x.id))
      return false;

    return true;
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

  static is(x: any): boolean {
    if (!x)
      return false;
    if (x && x.objectType && x.objectType === "SubStatement")
      return true;
    else
      return false;

    //TODO
  }
}

class InteractionComponent {
  id: string;
  description?: { [key: string]: string };

  constructor(raw: { [key: string]: any }) {
    this.id = raw.id;
    this.description = raw.description;
  }

  static is(x: any): boolean {
    if (!x)
      return false;

    if (typeof x.id !== "string" || stringIsInvalidJson(x.id))
      return false;

    if (x.description) {
      if (typeof x.description !== "object")
        return false;

      for (let key in x.description) {
        if (typeof key !== "string" || stringIsInvalidJson(key))
          return false;

        if (typeof x.description[key] !== "string" || stringIsInvalidJson(x.description[key]))
          return false;
      }
    }

    return true;
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

  static is(x: any): boolean {
    if (!x)
      return false;

    if (typeof x.objectType !== "string" || x.objectType !== "Activity")
      return false

    if (typeof x.id !== "string" || stringIsInvalidJson(x.id))
      return false;

    if (x.definition) {
      if (typeof x.definition !== "object")
        return false;

      if (x.definition.name) {
        if (typeof x.definition.name !== "object")
          return false;

        for (let key in x.definition.name) {
          if (typeof key !== "string" || stringIsInvalidJson(key))
            return false;

          if (typeof x.definition.name[key] !== "string" || stringIsInvalidJson(x.definition.name[key]))
            return false;
        }
      }

      if (x.definition.description) {
        if (typeof x.definition.description !== "object")
          return false;

        for (let key in x.definition.description) {
          if (typeof key !== "string" || stringIsInvalidJson(key))
            return false;

          if (typeof x.definition.description[key] !== "string" || stringIsInvalidJson(x.definition.description[key]))
            return false;
        }
      }

      if (x.type && (typeof x.type !== "string" || stringIsInvalidJson(x.type)))
        return false;

      if (x.moreInfo && (typeof x.moreInfo !== "string" || stringIsInvalidJson(x.moreInfo)))
        return false;

      if (x.interactionType && (typeof x.interactionType !== "string" || stringIsInvalidJson(x.interactionType)))
        return false;

      if (x.correctResponsePattern) {
        if (!Array.isArray(x.correctResponsePattern) || !x.correctResponsePattern.every((string: any) => { return (typeof string === "string" && !stringIsInvalidJson(string)) }))
          return false;
      }

      if (x.choices) {
        if (!Array.isArray(x.choices) || !x.choices.every((choice: any) => { return InteractionComponent.is(choice) }))
          return false;
      }

      if (x.scale) {
        if (!Array.isArray(x.scale) || !x.scale.every((s: any) => { return InteractionComponent.is(s) }))
          return false;
      }

      if (x.source) {
        if (!Array.isArray(x.source) || !x.source.every((s: any) => { return InteractionComponent.is(s) }))
          return false;
      }

      if (x.target) {
        if (!Array.isArray(x.target) || !x.target.every((t: any) => { return InteractionComponent.is(t) }))
          return false;
      }

      if (x.steps) {
        if (!Array.isArray(x.steps) || !x.steps.every((step: any) => { return InteractionComponent.is(step) }))
          return false;
      }


    }

    return true;
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

  static is(x: any): boolean {
    if (!x)
      return false;

    if (typeof x.usageType !== "string" || stringIsInvalidJson(x.usageType))
      return false;

    if (typeof x.display !== "object" || x.display === null)
      return false;

    for (let key in x.display) {
      if (stringIsInvalidJson(key))
        return false;

      if (typeof x.display[key] !== "string" || stringIsInvalidJson(x.display[key]))
        return false;
    }

    if (x.description) {
      if (typeof x.description !== "object")
        return false;

      for (let key in x.description) {
        if (stringIsInvalidJson(key))
          return false;

        if (typeof x.description[key] !== "string" || stringIsInvalidJson(x.description[key]))
          return false;
      }
    }

    if (typeof x.contentType !== "string" || stringIsInvalidJson(x.contentType))
      return false;

    if (typeof x.length !== "number")
      return false;

    if (typeof x.sha2 !== "string" || stringIsInvalidJson(x.sha2))
      return false;

    if (x.fileUrl) {
      if (typeof x.fileUrl !== "string" || stringIsInvalidJson(x.fileUrl))
        return false;
    }

    return true;
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
  readonly result?: {
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
  readonly attachments?: Attachment[];
  stored: string;
  readonly timestamp?: string;

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
      "stored": new Date().toISOString(),
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
    if (!x)
      return false;

    if (!Verb.is(x.verb))
      return false;

    if (typeof x.id !== 'string' || stringIsInvalidJson(x.id))
      return false;

    if (!ActivityObject.is(x.object) && !AgentObject.is(x.object) && !GroupObject.is(x.object) && !StatementRefObject.is(x.object) && !SubStatementObject.is(x.object))
      return false;

    if (!AgentObject.is(x.actor) && !GroupObject.is(x.actor))
      return false;

    if (x.context) {
      if (typeof x.context !== 'object')
        return false;

      if (x.context.registration) {
        if (typeof x.context.registration !== "string" || stringIsInvalidJson(x.context.registration))
          return false;

        if (x.context.instructor && !AgentObject.is(x.context.instructor))
          return false;

        if (x.context.team && !GroupObject.is(x.context.team))
          return false;

        if (x.context.contextActivities) {
          if (typeof x.context.contextActivities !== 'object')
            return false;

          if (x.context.contextActivities.parent) {
            if (!Array.isArray(x.context.contextActivities.parent))
              return false;

            if (!x.context.contextActivities.parent.every((parent: any) => { return ActivityObject.is(parent) }))
              return false;
          }

          if (x.context.contextActivities.grouping) {
            if (!Array.isArray(x.context.contextActivities.grouping))
              return false;

            if (!x.context.contextActivities.grouping.every((grouping: any) => { return ActivityObject.is(grouping) }))
              return false;
          }

          if (x.context.contextActivities.category) {
            if (!Array.isArray(x.context.contextActivities.category))
              return false;

            if (!x.context.contextActivities.category.every((category: any) => { return ActivityObject.is(category) }))
              return false;
          }

          if (x.context.contextActivities.other) {
            if (!Array.isArray(x.context.contextActivities.other))
              return false;

            if (!x.context.contextActivities.other.every((other: any) => { return ActivityObject.is(other) }))
              return false;
          }
        }
      }
    }

    if (x.result) {
      if (typeof x.result !== 'object')
        return false;

      if (x.result.score) {
        if (typeof x.result.score !== 'object')
          return false

        if (x.result.score.scaled) {
          if (typeof x.result.score.scaled !== "number")
            return false;

          if (x < -1 || x > 1)
            return false;
        }

        if (x.result.score.raw) {
          if (typeof x.result.score.raw !== "number")
            return false;

          if (x.result.score.min && x.result.score.raw < x.result.score.min)
            return false;

          if (x.result.score.max && x.result.score.raw > x.result.score.max)
            return false;
        }

        if (x.result.score.min) {
          if (typeof x.result.score.min !== "number")
            return false;

          if (x.result.score.max && x.result.score.min > x.result.score.max)
            return false;
        }

        if (x.result.score.max) {
          if (typeof x.result.score.max !== "number")
            return false;

          if (x.result.score.min && x.result.score.max < x.result.score.min)
            return false;
        }
      }

      if (x.result.success !== undefined) {
        if (typeof x.result.success !== "boolean")
          return false;
      }

      if (x.result.completion !== undefined) {
        if (typeof x.result.completion !== "boolean")
          return false;
      }

      if (x.result.response) {
        if (typeof x.result.response !== "string" || stringIsInvalidJson(x.result.response))
          return false;
      }

      if (x.result.duration) {
        if (typeof x.result.duration !== "string" || stringIsInvalidJson(x.result.response))
          return false;
      }

      if (x.result.extensions) {
        if (typeof x.result.extensions !== "object")
          return false;

        for (let key in x.result.extensions) {
          if (typeof key !== "string" || stringIsInvalidJson(key))
            return false;

          if (typeof x.result.extensions[key] === "string" && stringIsInvalidJson(x.result.extensions[key]))
            return false;
        }
      }
    }

    if (x.attachments) {
      if (!Array.isArray(x.attachments))
        return false;

      if (!x.attachments.every((attachment: any) => { return Attachment.is(attachment) }))
        return false;
    }

    if (x.stored && (typeof x.stored !== "string" || stringIsInvalidJson(x.stored)))
      return false;

    if (x.timestamp && (typeof x.timestamp !== "string" || stringIsInvalidJson(x.timestamp)))
      return false;

    return true;
  }
}

export class Voided extends XApiStatement {
  readonly thread: string;
  readonly target: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);
    this.thread = (this.context && this.context.contextActivities && this.context.contextActivities.parent) ? this.context.contextActivities.parent[0].id : "";
    if (this.thread.indexOf(PREFIX_PEBL_THREAD) != -1)
      this.thread = this.thread.substring(PREFIX_PEBL_THREAD.length);

    let object = this.object as ActivityObject;
    this.target = object.id;
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "voided");
  }
}
