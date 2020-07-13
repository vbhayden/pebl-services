
export interface ArchiveManager {
  setUserArchived(userId: string, isArchived: boolean, callback: () => void): void;

  isUserArchived(userId: string, callback: ((isArchived: boolean) => void)): void;
}
