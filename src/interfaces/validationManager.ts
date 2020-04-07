import { PeBLPlugin } from "../models/peblPlugin";

export interface ValidationManager {
  validate(data: { [key: string]: any }): boolean;
  register(plugin: PeBLPlugin): void;
}
