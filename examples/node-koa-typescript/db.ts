import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

interface User {
  id: string
  username: string
  password: string
}

const DB_PATH: string = process.env.DB_PATH || ':memory:';
const SALT = process.env.PASSWORD_SALT || crypto.randomBytes(128).toString('base64');

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY,
    username TEXT,
    password TEXT
  )
`);

const findUserByUsername = db.prepare(`
  SELECT *
  FROM users
  WHERE username = ?
`);

const insertUser = db.prepare(`
  INSERT INTO users (id, username, password)
  VALUES (?, ?, ?)
`);

const hashPassword = async (password: string): Promise<string> => {
  const hash = crypto.pbkdf2Sync(password, SALT, 10000, 512, 'sha512');
  return hash.toString('base64');
}

export const createUser = async (username: string, password: string): Promise<User> => {
  const existingUser = findUserByUsername.get(username);
  if (existingUser) {
    throw new Error('User with username already exists.');
  }

  const user: User = {
    id: crypto.randomUUID(),
    username,
    password: await hashPassword(password),
  };

  insertUser.run(user.id, user.username, user.password);
  return user;
};
