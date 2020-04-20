export interface SessionDataManager {

  setHashValues(key: string, values: string[], callback?: (worked: "OK") => void): void;
  setHashValue(key: string, field: string, value: string, callback?: (fields: number) => void): void;
  setHashValueIfNotExisting(key: string, field: string, value: string, callback?: (didSet: boolean) => void): void;

  getHashValues(key: string, callback: (data: string[]) => void): void;
  getHashKeys(key: string, callback: (data: string[]) => void): void;
  getHashValue(key: string, field: string, callback: (data?: string) => void): void;
  getHashMultiField(key: string, fields: string[], callback: (data: string[]) => void): void;
  getHashMultiKeys(keys: string[], callback: (data: { [key: string]: string[] }) => void): void;

  deleteHashValue(key: string, field: string, callback: (deleted: boolean) => void): void;
  deleteValue(key: string, callback?: (deleted: boolean) => void): void;

  addSetValue(key: string, value: (string[] | string), callback?: (added: number) => void): void;
  getSetValues(key: string, callback: (data: string[]) => void): void;
  deleteSetValue(key: string, value: string, callback?: (deleted: boolean) => void): void;

  addTimestampValue(key: string, timestamp: number, value: string): void;
  getValuesGreaterThanTimestamp(key: string, timestamp: number, callback: ((data: string[]) => void)): void;
  deleteSortedTimestampMember(key: string, memberId: string, callback: (deleted: number) => void): void;

  queueForLrs(value: string): void;
  queueForLrsVoid(value: string): void;
  retrieveForLrs(count: number, callback: ((value?: string[]) => void)): void;
  trimForLrs(count: number): void;

  removeBadLRSStatement(id: string): void;

  broadcast(channel: string, message: string): void;
}
