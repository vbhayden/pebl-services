import { Severity, severityEnums, LogCategory } from "../utils/constants";

export enum SyslogFacility {
  USER = 1, //user 
  DAEMON = 3, //daemon - anything that runs in the background like jobs
  AUTH = 4, //auth - anything that deals with authentication or authorization
  FTP = 11, //ftp - transferring files in and out of the server
  NETWORK = 16, //local0 - network traffic related like HTTP POST, GET, and DELETE
  STORAGE = 17, //local1 - things like DBs
  STANDARD = 18 //local2 - anything that doesn't fit into other categories most likely goes here

  //theses are open still, syslog format says that we can go from 16-23 for custom 
  //facility ids and still be in spec
  // OPEN1, //local3
  // OPEN2, //local4
  // OPEN3, //local5
  // OPEN4, //local6
  // OPEN5 //local7
}

export class DefaultAuditLogManager {
  private logBuffers: string[][];
  private debugging: boolean;
  private writeOutHandlers: NodeJS.Timeout[];

  private readonly MAX_BUFFER_ENTRIES = 3000;
  private readonly TIMEOUT_FLUSH = 20 * 1000;

  private config: { [key: string]: any };
  private hostname: string;
  private version: string;
  private usingSyslogFormat: boolean;

  constructor(config: { [key: string]: any }) {
    this.config = config;
    this.debugging = config.debugging ? config.debugging : false;
    this.hostname = config.serverName.substr(0, 255);
    this.logBuffers = [];
    for (let i = 0; i < 8; i++) {
      this.logBuffers.push([]);
    }
    this.writeOutHandlers = [];
    this.version = (" PeBL-services." + this.config.version).substr(0, 48);
    this.usingSyslogFormat = this.config["usingSyslogFormat"];
  }

  private syslogFormat(facility: LogCategory,
    severity: Severity,
    timestamp: Date,
    msgID: string,
    data: string): string {

    let str: string[] = [];

    if (this.usingSyslogFormat) {
      str.push("<" + ((SyslogFacility.USER * 8) + severity) + ">"); //priority
      // str.push("<" + ((facility * 8) + severity) + ">"); //priority
      str.push("1"); //version of syslog
    }
    str.push(" " + timestamp.toISOString()); // timestamp
    if (this.usingSyslogFormat) {
      str.push(" " + this.hostname); // this server host
    }
    str.push(this.version); // service name
    if (this.usingSyslogFormat) {
      str.push(" " + process.pid); // process id
    }
    str.push(" " + facility + msgID.trim().substr(0, 27)); //message type
    if (this.usingSyslogFormat) {
      str.push(" -"); //structured data
      str.push(" BOM" + data); //unstructured msg
    } else {
      str.push(" " + data); //unstructured msg
    }

    return str.join("");
  }

  /* 
   * @param message must be 27 or fewer characters and no spaces otherwise it will be truncated to 27
   */
  report(system: LogCategory, severity: Severity, message: string, ...data: any[] | { [key: string]: any }[] | string[]) {
    if (this.debugging) {
      if (this.writeOutHandlers[severity]) {
        clearTimeout(this.writeOutHandlers[severity]);
      }
      this.logBuffers[severity].push(this.syslogFormat(system, severity, new Date(), message, JSON.stringify(data)));
      if (this.debugging || (this.logBuffers[severity].length > this.MAX_BUFFER_ENTRIES)) {
        this.flush(severity);
      } else {
        this.writeOutHandlers[severity] = setTimeout(() => {
          this.flush.bind(this)(severity);
        },
          this.TIMEOUT_FLUSH);
      }
    }
  }

  flush(severity?: Severity): void {
    if (severity !== undefined) {
      if (severity > Severity.ERROR) {
        console.log(this.logBuffers[severity].join("\n"));
      } else {
        console.error(this.logBuffers[severity].join("\n"));
      }
      this.logBuffers[severity] = [];
    } else {
      for (let s of severityEnums) {
        this.flush(s);
      }
    }
  }
}
