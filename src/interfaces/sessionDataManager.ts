export interface SessionDataManager {

  setHashValues(key: string, values: string[], callback?: (worked: "OK") => void): void;
  setHashValue(key: string, field: string, value: string, callback?: (fields: number) => void): void;
  setHashValueIfNotExisting(key: string, field: string, value: string, callback?: (didSet: boolean) => void): void;

  getAllHashPairs(key: string, callback: (data: { [key: string]: string }) => void): void;

  getHashValues(key: string, callback: (data: string[]) => void): void;
  getHashKeys(key: string, callback: (data: string[]) => void): void;
  incHashKey(key: string, id: string, increment: number, callback?: (num: number) => void): void;
  incHashKeys(key: string, ids: string[], increment: number, callback?: (nums: { [key: string]: number }) => void): void;
  getHashValue(key: string, field: string, callback: (data?: string) => void): void;
  getHashMultiField(key: string, fields: string[], callback: (data: string[]) => void): void;
  getHashMultiKeys(keys: string[], callback: (data: { [key: string]: string[] }) => void): void;

  deleteHashValue(key: string, field: string, callback: (deleted: boolean) => void): void;
  deleteValue(key: string, callback?: (deleted: boolean) => void): void;
  deleteValues(keys: string[], callback: (deleted: boolean) => void): void;

  isMemberSetValue(key: string, id: string, callback: (exists: boolean) => void): void;
  addSetValue(key: string, value: (string[] | string), callback?: (added: number) => void): void;
  getSetValues(key: string, callback: (data: string[]) => void): void;
  deleteSetValue(key: string, value: string, callback?: (deleted: boolean) => void): void;
  unionSetValues(key: string | string[], callback: (data: string[]) => void): void;

  addTimestampValue(key: string, timestamp: number, value: string): void;
  addTimestampValues(key: string, timestampPairs: (number | string)[]): void;

  getValuesGreaterThanTimestamp(key: string, timestamp: number, callback: ((data: string[]) => void)): void;
  // getValuesLessThanTimestamp(key: string, timestamp: number, callback: ((data: string[]) => void)): void;
  deleteSortedTimestampMember(key: string, memberId: string, callback: (deleted: number) => void): void;
  rankSortedSetMember(key: string, id: string, callback: (rank: (number | null)) => void): void;

  queueForLrs(value: string): void;
  queueForLrsVoid(value: string): void;
  retrieveForLrs(count: number, callback: ((value?: string[]) => void)): void;
  trimForLrs(count: number): void;

  dumpKey(key: string, callback: (data?: string) => void): void;
  dumpKeys(key: string[], callback: (data?: { [key: string]: string }) => void): void;
  // restoreKey(key: string, ttl: number, data: string, callback?: (restored: boolean) => void): void;
  // restoreKeys(data: { [key: string]: string }, ttl: number, callback?: (restored: { [key: string]: boolean }) => void): void;

  scan10(cursor: string, pattern: string, callback: (data: [string, string[]]) => void): void;
  keys(pattern: string, callback: (data: string[]) => void): void;

  removeBadLRSStatement(id: string): void;

  broadcast(channel: string, message: string): void;
}
