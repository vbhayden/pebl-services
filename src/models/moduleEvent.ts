import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL_EXTENSION } from "../utils/constants";

export class ModuleEvent extends XApiStatement {
  constructor(raw: { [key: string]: any }) {
    super(raw);
  }
}

export class ModuleRating extends ModuleEvent {
  readonly rating: string;
  readonly idref: string;
  readonly programId?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {}
    if (!object.definition.name)
      object.definition.name = {}
    if (!object.definition.extensions)
      object.definition.extensions = {}

    let extensions = object.definition.extensions;

    this.rating = object.definition.name["en-US"];

    this.idref = extensions[PREFIX_PEBL_EXTENSION + "idref"];
    this.programId = extensions[PREFIX_PEBL_EXTENSION + "programId"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "moduleRating")
  }
}

export class ModuleFeedback extends ModuleEvent {
  readonly feedback: string;
  readonly willingToDiscuss: string;
  readonly idref: string;
  readonly programId?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {}
    if (!object.definition.name)
      object.definition.name = {}
    if (!object.definition.extensions)
      object.definition.extensions = {}

    let extensions = object.definition.extensions;

    this.feedback = object.definition.name["en-US"];

    this.willingToDiscuss = extensions[PREFIX_PEBL_EXTENSION + "willingToDiscuss"];
    this.idref = extensions[PREFIX_PEBL_EXTENSION + "idref"];
    this.programId = extensions[PREFIX_PEBL_EXTENSION + "programId"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "moduleFeedback")
  }
}

export class ModuleExample extends ModuleEvent {
  readonly example: string;
  readonly description: string;
  readonly idref: string;
  readonly youtubeUrl?: string;
  readonly imageUrl?: string;
  readonly websiteUrl?: string;
  readonly quotedPerson?: string;
  readonly quotedTeam?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {}
    if (!object.definition.name)
      object.definition.name = {}
    if (!object.definition.extensions)
      object.definition.extensions = {}
    if (!object.definition.description)
      object.definition.description = {}

    let extensions = object.definition.extensions;

    this.example = object.definition.name["en-US"];

    this.description = object.definition.description["en-US"];

    this.idref = extensions[PREFIX_PEBL_EXTENSION + "idref"];
    this.youtubeUrl = extensions[PREFIX_PEBL_EXTENSION + "youtubeUrl"];
    this.imageUrl = extensions[PREFIX_PEBL_EXTENSION + "imageUrl"];
    this.websiteUrl = extensions[PREFIX_PEBL_EXTENSION + "websiteUrl"];
    this.quotedPerson = extensions[PREFIX_PEBL_EXTENSION + "quotedPerson"];
    this.quotedTeam = extensions[PREFIX_PEBL_EXTENSION + "quotedTeam"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "moduleExample");
  }
}

export class ModuleExampleRating extends ModuleEvent {
  readonly rating: string;
  readonly idref: string;
  readonly programId?: string;
  readonly exampleId?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {}
    if (!object.definition.name)
      object.definition.name = {}
    if (!object.definition.extensions)
      object.definition.extensions = {}

    let extensions = object.definition.extensions;

    this.rating = object.definition.name["en-US"];

    this.idref = extensions[PREFIX_PEBL_EXTENSION + "idref"];
    this.programId = extensions[PREFIX_PEBL_EXTENSION + "programId"];
    this.exampleId = extensions[PREFIX_PEBL_EXTENSION + "exampleId"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "moduleExampleRating")
  }
}

export class ModuleExampleFeedback extends ModuleEvent {
  readonly feedback: string;
  readonly willingToDiscuss: string;
  readonly idref: string;
  readonly programId?: string;
  readonly exampleId?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {}
    if (!object.definition.name)
      object.definition.name = {}
    if (!object.definition.extensions)
      object.definition.extensions = {}

    let extensions = object.definition.extensions;

    this.feedback = object.definition.name["en-US"];

    this.willingToDiscuss = extensions[PREFIX_PEBL_EXTENSION + "willingToDiscuss"];
    this.idref = extensions[PREFIX_PEBL_EXTENSION + "idref"];
    this.programId = extensions[PREFIX_PEBL_EXTENSION + "programId"];
    this.exampleId = extensions[PREFIX_PEBL_EXTENSION + "exampleId"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "moduleExampleFeedback");
  }
}

export class ModuleRemovedEvent extends ModuleEvent {
  readonly idref: string;
  readonly eventId: string;
  readonly type?: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;
    if (!object.definition)
      object.definition = {}
    if (!object.definition.name)
      object.definition.name = {}
    if (!object.definition.extensions)
      object.definition.extensions = {}
    if (!object.definition.description)
      object.definition.description = {}

    let extensions = object.definition.extensions;

    this.idref = object.definition.name["en-US"];

    this.eventId = object.definition.description["en-US"];

    this.type = extensions[PREFIX_PEBL_EXTENSION + "type"];
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "moduleRemovedEvent");
  }
}
