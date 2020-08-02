import { SqlDataStore } from '../interfaces/sqlDataStore';
import { Pool } from 'pg';
import { Action } from '../models/action';
import { Session } from '../models/session';
import { Message } from '../models/message';
import { Question } from '../models/question';
import { auditLogger } from '../main';
import { LogCategory, Severity } from '../utils/constants';

export class PgSqlDataStore implements SqlDataStore {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;

    this.pool.connect().then((client) => {
      client.query('CREATE TABLE IF NOT EXISTS completions ( id uuid PRIMARY KEY, bookId VARCHAR ( 255 ), chapter VARCHAR ( 255 ), teamId VARCHAR ( 255 ), classId VARCHAR ( 255 ), identity VARCHAR ( 255 ), timestamp BIGINT);').then(() => {
        return client.query('CREATE TABLE IF NOT EXISTS logins (id uuid PRIMARY KEY, teamId VARCHAR ( 255 ), classId VARCHAR ( 255 ), identity VARCHAR ( 255 ), timestamp BIGINT);');
      }).then(() => {
        return client.query('CREATE TABLE IF NOT EXISTS discussions (id SERIAL PRIMARY KEY, bookId VARCHAR ( 255 ), thread VARCHAR ( 255 ), prompt TEXT, teamId VARCHAR ( 255 ), classId VARCHAR ( 255 ), count INTEGER, url TEXT, UNIQUE (thread, teamId, classId));');
      }).then(() => {
        return client.query('CREATE TABLE IF NOT EXISTS quizattempts (id SERIAL PRIMARY KEY, bookId VARCHAR ( 255 ), quizId VARCHAR ( 255 ), question TEXT, response TEXT, correct BOOL, teamId VARCHAR ( 255 ), classId VARCHAR ( 255 ), count INTEGER, url TEXT, UNIQUE (quizId, question, response, teamId, classId));');
      }).finally(() => {
        client.release();
      })
    }).catch((e) => {
      auditLogger.report(LogCategory.STORAGE, Severity.EMERGENCY, "PostgresConnectFailed", e);
      process.exit(1);
    });
  }

  async insertQuizAttempts(data: Question[]) {
    const text = 'INSERT INTO quizattempts(bookId, quizId, question, response, correct, teamId, classId, count, url) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (quizId, question, response, teamId, classId) DO UPDATE SET count = quizattempts.count + 1, url = $9;';
    const client = await this.pool.connect();
    try {
      for (let question of data) {
        question = new Question(question);
        const values = [question.book, question.activityId, question.prompt, question.response, question.success, question.currentTeam, question.currentClass, 1, question.contextUrl];
        client.query(text, values);
      }
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  async getQuizAttempts(bookId: string, teamId: string, classId: string, callback: ((stmts: any) => void)) {
    const text = 'SELECT quizId, question, response, correct, count, url FROM quizattempts WHERE bookId = $1 AND teamId = $2 AND classId = $3';
    const client = await this.pool.connect();
    try {
      client.query(text, [bookId, teamId, classId]).then((res) => {
        callback(res.rows);
      })
    } catch (e) {
      console.log(e);
      callback([]);
    } finally {
      client.release();
    }
  }

  async insertDiscussions(data: Message[]) {
    const text = 'INSERT INTO discussions(bookId, thread, prompt, teamId, classId, count, url) VALUES($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (thread, teamId, classId) DO UPDATE SET count = discussions.count + 1, url = $7;';
    const client = await this.pool.connect();
    try {
      for (let message of data) {
        message = new Message(message);
        const values = [message.bookId, message.thread, message.prompt, message.currentTeam, message.currentClass, 1, message.contextUrl];
        client.query(text, values);
      }
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  async getMostAnsweredDiscussions(bookId: string, teamId: string, classId: string, callback: ((stmts: any) => void)) {
    const text = 'SELECT prompt, count, url FROM discussions WHERE bookId = $1 AND teamId = $2 AND classId = $3 ORDER BY count DESC LIMIT 5';
    const client = await this.pool.connect();
    try {
      client.query(text, [bookId, teamId, classId]).then((res) => {
        callback(res.rows);
      })
    } catch (e) {
      console.log(e);
      callback([]);
    } finally {
      client.release();
    }
  }

  async getLeastAnsweredDiscussions(bookId: string, teamId: string, classId: string, callback: ((stmts: any) => void)) {
    const text = 'SELECT prompt, count, url FROM discussions WHERE bookId = $1 AND teamId = $2 AND classId = $3 ORDER BY count ASC LIMIT 5';
    const client = await this.pool.connect();
    try {
      client.query(text, [bookId, teamId, classId]).then((res) => {
        callback(res.rows);
      })
    } catch (e) {
      console.log(e);
      callback([]);
    } finally {
      client.release();
    }
  }

  async insertLogins(data: Session[]) {
    const text = 'INSERT INTO logins(id, teamId, classId, identity, timestamp) VALUES($1, $2, $3, $4, $5);';
    const client = await this.pool.connect();
    try {
      for (let login of data) {
        const values = [login.id, login.currentTeam, login.currentClass, new Session(login).getActorId(), new Date(login.timestamp as string).getTime()];
        client.query(text, values);
      }
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  async getLogins(teamId: string, classId: string, timestamp: number, callback: ((stmts: string[]) => void)) {
    const text = 'SELECT DISTINCT identity FROM logins WHERE teamId = $1 AND classId = $2 AND timestamp > $3;';
    const client = await this.pool.connect();
    try {
      client.query(text, [teamId, classId, timestamp]).then((res) => {
        callback(res.rows);
      })
    } catch (e) {
      console.log(e);
      callback([]);
    } finally {
      client.release();
    }
  }

  async insertCompletions(data: Action[]) {
    const text = 'INSERT INTO completions(id, bookId, chapter, teamId, classId, identity, timestamp) VALUES($1, $2, $3, $4, $5, $6, $7);';
    const client = await this.pool.connect();
    try {
      for (let action of data) {
        const values = [action.id, action.book, action.name, action.currentTeam, action.currentClass, new Action(action).getActorId(), new Date(action.timestamp as string).getTime()];
        client.query(text, values);
      }
    } catch (e) {
      console.log(e);
    } finally {
      client.release();
    }
  }

  async getCompletions(bookId: string, teamId: string, classId: string, timestamp: number, callback: ((stmts: { [key: string]: string }[]) => void)) {
    const text = 'SELECT DISTINCT chapter, identity FROM completions WHERE bookId = $1 AND teamId = $2 AND classId = $3 AND timestamp > $4;';
    const client = await this.pool.connect();
    try {
      client.query(text, [bookId, teamId, classId, timestamp]).then((res) => {
        callback(res.rows);
      })
    } catch (e) {
      console.log(e);
      callback([]);
    } finally {
      client.release();
    }
  }

}
