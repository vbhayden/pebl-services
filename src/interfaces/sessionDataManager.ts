export interface SessionDataManager {

  setHashValues(key: string, values: string[]): void;
  getHashValues(key: string, callback: (data: string[]) => void): void;
  deleteHashValue(key: string, field: string, callback: (deleted: boolean) => void): void;

}
