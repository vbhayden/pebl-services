import { Severity, LogCategory } from "../utils/constants";

export interface AuditLogManager {
  report(system: LogCategory, severity: Severity, message: string, ...data: any[] | { [key: string]: any }[] | string[]): void;
  flush(severity?: Severity): void;
}
