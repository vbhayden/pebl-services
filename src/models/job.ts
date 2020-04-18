export class JobMessage {

  readonly timeout: number;
  readonly jobType: string;
  startTime?: number;
  finished?: boolean;

  constructor(jobType: string, timeout: number, startTime?: number, finished?: boolean) {
    this.jobType = jobType;
    this.timeout = timeout;
    this.startTime = startTime;
    this.finished = finished;
  }

  static parse(data: string): JobMessage {
    let o = JSON.parse(data);
    return new JobMessage(o.jobType, o.timeout, o.startTime, o.finished);
  }
}
