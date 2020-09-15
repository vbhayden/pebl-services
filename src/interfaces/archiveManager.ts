
export interface ArchiveManager {
  setUserArchived(userId: string, isArchived: boolean): Promise<true>;

  isUserArchived(userId: string): Promise<boolean>;
}
