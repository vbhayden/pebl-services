import { Action } from '../models/action';
import { Session } from '../models/session';
import { Message } from '../models/message';
import { Question } from '../models/question';

export interface SqlDataStore {
  insertCompletions(data: Action[]): void;
  getCompletions(bookId: string, teamId: string, classId: string, timestamp: number): Promise<any[]>;

  insertLogins(data: Session[]): void;
  getLogins(teamId: string, classId: string, timestamp: number): Promise<string[]>;

  insertReportedThreadedMessages(data: Message[]): void;
  insertDiscussions(data: Message[]): void;
  getReportedThreadedMessages(bookId: string, teamId: string, classId: string): Promise<any[]>;
  deleteReportedThreadedMessage(data: string[]): void;
  getLeastAnsweredDiscussions(bookId: string, teamId: string, classId: string): Promise<any[]>;
  getMostAnsweredDiscussions(bookId: string, teamId: string, classId: string): Promise<any[]>;

  insertQuizAttempts(data: Question[]): void;
  getQuizAttempts(bookId: string, teamId: string, classId: string): Promise<any[]>;

}
