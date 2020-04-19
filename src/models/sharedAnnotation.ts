import { Annotation } from "./annotation";
import { XApiStatement } from "./xapiStatement";

export class SharedAnnotation extends Annotation {
  constructor(raw: { [key: string]: any }) {
    super(raw);
  }

  static is(x: XApiStatement): boolean {
    let verb = x.verb.display["en-US"];
    return (verb == "shared");
  }
}
