import { PeBLPlugin } from "../models/peblPlugin";

export interface ThreadManager extends PeBLPlugin {
  validateStoreThreadedMessage(payload: { [key: string]: any }): boolean;
}
