import { MessageTemplate } from "../models/messageTemplate";
import { PeBLPlugin } from "../models/peblPlugin";

export interface PluginManager {
  getMessageTemplate(verb: string): MessageTemplate | null;
  getMessageTemplates(): { [key: string]: MessageTemplate };
  register<T extends PeBLPlugin>(plugin: T): void
}
