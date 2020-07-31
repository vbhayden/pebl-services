import { Action } from '../models/action';
import { Session } from '../models/session';
import { Message } from '../models/message';
import { Question } from '../models/question';

export interface SqlDataStore {
  insertCompletions(data: Action[]): void;
  getCompletions(bookId: string, teamId: string, classId: string, timestamp: number, callback: ((stmts: any[]) => void)): void;

  insertLogins(data: Session[]): void;
  getLogins(teamId: string, classId: string, timestamp: number, callback: ((stmts: any[]) => void)): void;

  insertDiscussions(data: Message[]): void;
  getLeastAnsweredDiscussions(bookId: string, teamId: string, classId: string, callback: ((stmts: any[]) => void)): void;
  getMostAnsweredDiscussions(bookId: string, teamId: string, classId: string, callback: ((stmts: any[]) => void)): void;

  insertQuizAttempts(data: Question[]): void;
  getQuizAttempts(bookId: string, teamId: string, classId: string, callback: ((stmts: any[]) => void)): void;

}
