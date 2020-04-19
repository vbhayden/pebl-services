import { Annotation } from "./annotation";
import { XApiStatement } from "./xapiStatement";

export class SharedAnnotation extends Annotation {
  constructor(raw: { [key: string]: any }) {
    super(raw);
  }

  static replaceInvalidJson(x: SharedAnnotation): SharedAnnotation {
    return new SharedAnnotation(XApiStatement.replaceInvalidJson(x));
  }

  static is(x: XApiStatement): boolean {
    if (!XApiStatement.is(x))
      return false;

    let verb = x.verb.display["en-US"];
    return (verb == "shared");
  }
}
