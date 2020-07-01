import { PeBLPlugin } from "../models/peblPlugin";
import { Question } from "../models/question";
import { Quiz } from "../models/quiz";

export interface QuizManager extends PeBLPlugin {

  validateGetQuestions(payload: { [key: string]: any }): boolean;
  validateSaveQuestions(payload: { [key: string]: any }): boolean;
  validateDeleteQuestion(payload: { [key: string]: any }): boolean;

  validateGetQuizes(payload: { [key: string]: any }): boolean;
  validateSaveQuizes(payload: { [key: string]: any }): boolean;
  validateDeleteQuiz(payload: { [key: string]: any }): boolean;

  getQuestions(identity: string, callback: ((stmts: Question[]) => void)): void
  saveQuestions(identity: string, stmts: Question[], callback: ((success: boolean) => void)): void;
  deleteQuestion(identity: string, id: string, callback: ((success: boolean) => void)): void;

  getQuizes(identity: string, callback: ((stmts: Quiz[]) => void)): void
  saveQuizes(identity: string, stmts: Quiz[], callback: ((success: boolean) => void)): void;
  deleteQuiz(identity: string, id: string, callback: ((success: boolean) => void)): void;
}
