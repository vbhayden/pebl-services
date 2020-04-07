export class XApiQuery {
  statementId?: string;
  voidedStatementId?: string;
  agent?: string;
  verb?: string;
  activity?: string;
  registration?: string;
  related_activities?: boolean;
  related_agents?: boolean;
  since?: string;
  until?: string;
  limit?: number;
  format?: string;
  attachments?: boolean;
  ascending?: boolean;

  constructor(raw: { [key: string]: any }) {
    this.statementId = raw.statementId;
    this.voidedStatementId = raw.voidedStatementId;
    this.agent = raw.agent;
    this.verb = raw.verb;
    this.activity = raw.activity;
    this.registration = raw.registration;
    this.related_activities = raw.related_activities;
    this.related_agents = raw.related_agents;
    this.since = raw.since;
    this.until = raw.until;
    this.limit = raw.limit;
    this.format = raw.format;
    this.attachments = raw.attachments;
    this.ascending = raw.ascending;
  }

  toQueryString(): string {
    let self = this;
    let queryString = Object.keys(this).reduce(function(result: string[], key) {
      if ((<any>self)[key] !== undefined) {
        result.push(key + '=' + (<any>self)[key]);
      }
      return result;
    }, []).join('&');
    return queryString;
  }
}
