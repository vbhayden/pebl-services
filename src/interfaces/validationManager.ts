export interface ValidationManager {
  validate(data: any): boolean;

  isMessageFormat(data: any): boolean;
}
