import { Action } from '../models/action';
import { Session } from '../models/session';
import { Message } from '../models/message';
import { Question } from '../models/question';

export interface SqlDataStore {
  insertCompletions(data: Action[]): Promise<void>;
  getCompletions(bookId: string, teamId: string, classId: string, timestamp: number): Promise<any[]>;

  insertLogins(data: Session[]): Promise<void>;
  getLogins(teamId: string, classId: string, timestamp: number): Promise<string[]>;

  insertReportedThreadedMessages(data: Message[]): Promise<void>;
  insertDiscussions(data: Message[]): Promise<void>;
  getReportedThreadedMessages(bookId: string, teamId: string, classId: string): Promise<any[]>;
  deleteReportedThreadedMessage(data: string[]): Promise<void>;
  getLeastAnsweredDiscussions(bookId: string, teamId: string, classId: string): Promise<any[]>;
  getMostAnsweredDiscussions(bookId: string, teamId: string, classId: string): Promise<any[]>;

  insertQuizAttempts(data: Question[]): Promise<void>;
  getQuizAttempts(bookId: string, teamId: string, classId: string): Promise<any[]>;

}
