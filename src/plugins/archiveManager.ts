import { SessionDataManager } from "../interfaces/sessionDataManager";

export class DefaultArchiveManager {
  private sessionData: SessionDataManager;
  private postgres: Client;

  constructor(sessionData: SessionDataManager, postgres: Client) {
    this.postgres = postgres;
    this.sessionData = sessionData;
  }

  archiveUserAnnotations(userId: string): void {

  }

  archiveUserNotifications(userId: string): void {

  }

  archiveUserThreads(userId: string): void {

  }

  restoreUserAnnotations(userId: string): void {

  }

  restoreUserNotifications(userId: string): void {

  }

  restoreUserThreads(userId: string): void {

  }

  setUserArchived(userId: string, isArchived: boolean): void {

  }

  isUserArchived(userId: string, callback: ((isArchived: boolean) => void)): void {

  }
}
