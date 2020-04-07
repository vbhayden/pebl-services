export interface ValidationManager {
  validate(data: { [key: string]: any }): boolean;
}
