import { XApiStatement } from "./xapiStatement";

export class ModuleEvent extends XApiStatement {
  constructor(raw: { [key: string]: any }) {
    super(raw);
  }
}
