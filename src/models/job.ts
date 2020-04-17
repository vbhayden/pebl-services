export class JobMessage {

  readonly timeout: number;
  readonly jobType: string;
  readonly id?: string;

  constructor(jobType: string, timeout: number, id?: string) {
    this.jobType = jobType;
    this.timeout = timeout;
    this.id = id;
  }

  static parse(data: string): JobMessage {
    let o = JSON.parse(data);
    return new JobMessage(o.jobType, o.timeout, o.id);
  }
}
