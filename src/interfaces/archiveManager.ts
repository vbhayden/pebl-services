
export interface ArchiveManager {
  setUserArchived(userId: string, isArchived: boolean): void;

  isUserArchived(userId: string, callback: ((isArchived: boolean) => void)): void;
}
