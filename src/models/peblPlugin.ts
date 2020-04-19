import { MessageTemplate } from './messageTemplate';

export class PeBLPlugin {
  private messageTemplates: MessageTemplate[];

  constructor() {
    this.messageTemplates = [];
  }

  getMessageTemplates(): MessageTemplate[] {
    return this.messageTemplates;
  }

  protected addMessageTemplate(messageTemplate: MessageTemplate) {
    this.messageTemplates.push(messageTemplate);
  }
}
