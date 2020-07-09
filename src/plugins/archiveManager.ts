import { SessionDataManager } from "../interfaces/sessionDataManager";
import { auditLogger } from "../main";
import { Severity, LogCategory, SET_ALL_ARCHIVE_USERS } from "../utils/constants";
// const { Sequelize, Model, DataTypes } = require('sequelize');

export class DefaultArchiveManager {
  private sessionData: SessionDataManager;
  // private postgres: Sequelize;

  constructor(sessionData: SessionDataManager, config: { [key: string]: any }) {
    // this.postgres = postgres;
    this.sessionData = sessionData;
  }

  // archiveUserAnnotations(userId: string): void {

  // }

  // archiveUserNotifications(userId: string): void {

  // }

  // archiveUserThreads(userId: string): void {

  // }

  // restoreUserAnnotations(userId: string): void {

  // }

  // restoreUserNotifications(userId: string): void {

  // }

  // restoreUserThreads(userId: string): void {

  // }

  private storeUserRecords(userId: string, records: { [key: string]: string }, callback: (stored: boolean) => void): void {

  }

  private retrieveUserRecords(userId: string, callback: (records: { [key: string]: string }) => void): void {

  }

  // private clearUserRecords(records: { [key: string]: string }): void {

  // }

  setUserArchived(userId: string, isArchived: boolean): void {
    let keys: string[] = [

    ];

    if (isArchived) {
      this.sessionData.dumpKeys(keys, (data?: { [key: string]: string }) => {
        this.storeUserRecords(userId, data, (stored: boolean) => {
          if (stored) {
            this.sessionData.removeKeys(keys, () => {
              this.sessionData.setHashValue(SET_ALL_ARCHIVE_USERS,
                userId,
                "t");
            });
          } else {
            auditLogger.report(LogCategory.STORAGE, Severity.ALERT, "ArchiveUserFail", userId);
          }
        });
      });
    } else {

    }
  }

  isUserArchived(userId: string, callback: ((isArchived: boolean) => void)): void {
    this.sessionData.getHashValue(SET_ALL_ARCHIVE_USERS,
      userId,
      (data?: string) => {
        callback("t" === data);
      });
  }
}
