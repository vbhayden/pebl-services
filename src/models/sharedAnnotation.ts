import { Annotation } from "./annotation";
import { XApiStatement, ActivityObject } from "./xapiStatement";
import { PREFIX_PEBL_EXTENSION } from "../utils/constants";


export class SharedAnnotation extends Annotation {
	groupId: string;

  constructor(raw: { [key: string]: any }) {
    super(raw);

    let object = this.object as ActivityObject;

    if (object.definition && object.definition.extensions) {
    	let extensions = object.definition.extensions;
    	this.groupId = extensions[PREFIX_PEBL_EXTENSION + 'groupId'];
    } else {
    	this.groupId = '';
    }
    
  }

  static is(x: SharedAnnotation): boolean {
    if (!XApiStatement.is(x))
      return false;

  	if (!x.groupId || typeof x.groupId !== 'string' || x.groupId.length === 0)
  		return false;

    let verb = x.verb.display["en-US"];
    return (verb == "shared");
  }
}
