import { MessageTemplate } from "../models/messageTemplate";
import { PeBLPlugin } from "../models/peblPlugin";

export interface PluginManager {
  getMessageTemplate(verb: string): MessageTemplate | null;
  register<T extends PeBLPlugin>(plugin: T): void
}
