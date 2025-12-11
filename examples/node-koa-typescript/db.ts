import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH: string = process.env.DB_PATH || ':memory:';
const SALT = process.env.PASSWORD_SALT || crypto.randomBytes(128).toString('base64');

export const db = new DatabaseSync(DB_PATH);

/*********************/
/* Initialize Tables */
/*********************/

db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id TEXT PRIMARY KEY,
    username TEXT,
    password TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tokens(
    accessToken TEXT PRIMARY KEY,
    refreshToken TEXT,
    clientId TEXT,
    userId TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS experiences(
    id TEXT PRIMARY KEY,
    userId TEXT,
    name TEXT,
    description TEXT,
    url TEXT,
    qrCodeUrl TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS experience_triggers(
    id TEXT PRIMARY KEY,
    experienceId TEXT,
    key TEXT,
    label TEXT,
    FOREIGN KEY(experienceId) REFERENCES experiences(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS experience_fields(
    id TEXT PRIMARY KEY,
    experienceId TEXT,
    key TEXT,
    label TEXT,
    defaultValue TEXT,
    isText INTEGER,
    FOREIGN KEY(experienceId) REFERENCES experiences(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS experience_field_options(
    id TEXT PRIMARY KEY,
    experienceId TEXT,
    fieldId TEXT,
    value TEXT,
    label TEXT,
    FOREIGN KEY(experienceId) REFERENCES experiences(id),
    FOREIGN KEY(fieldId) REFERENCES experience_fields(id)
  )
`);

/********************/
/* Prepared Queries */
/********************/

const findUserById = db.prepare(`
  SELECT *
  FROM users
  WHERE id = ?
`);

const findUserByUsername = db.prepare(`
  SELECT *
  FROM users
  WHERE username = ?
`);

const findUserByUsernameAndPassword = db.prepare(`
  SELECT *
  FROM users
  WHERE username = ?
    AND password = ?
`);

const findUserByAccessToken = db.prepare(`
  SELECT user.*
  FROM users user
  JOIN tokens token
    ON user.id = token.userId
  WHERE token.accessToken = ?
`);

const insertUser = db.prepare(`
  INSERT INTO users (id, username, password)
  VALUES (?, ?, ?)
`);

const insertToken = db.prepare(`
  INSERT INTO tokens (accessToken, refreshToken, clientId, userId)
  VALUES (?, ?, ?, ?)
`);

const insertExperience = db.prepare(`
  INSERT INTO experiences (id, userId, name, description, url, qrCodeUrl)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertExperienceTrigger = db.prepare(`
  INSERT INTO experience_triggers (id, experienceId, key, label)
  VALUES (?, ?, ?, ?)
`);

const insertExperienceField = db.prepare(`
  INSERT INTO experience_fields (id, experienceId, key, label, defaultValue, isText)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertExperienceFieldOption = db.prepare(`
  INSERT INTO experience_field_options (id, experienceId, fieldId, value, label)
  VALUES (?, ?, ?, ?, ?)
`);

const findExperienceById = db.prepare(`
  SELECT *
  FROM experiences
  WHERE userId = ?
    AND id = ?
`);

const findExperiencesByUserId = db.prepare(`
  SELECT *
  FROM experiences
  WHERE userId = ?
`);

const findExperienceTriggers = db.prepare(`
  SELECT *
  FROM experience_triggers
  WHERE experienceId = ?
`);

const findExperienceFields = db.prepare(`
  SELECT *
  FROM experience_fields
  WHERE experienceId = ?
`);

const findFieldOptions = db.prepare(`
  SELECT *
  FROM experience_field_options
  WHERE fieldId = ?
`);

/*************/
/* Utilities */
/*************/

const generateId = () => crypto.randomUUID();

const hashPassword = (password: string): string => {
  const hash = crypto.pbkdf2Sync(password, SALT, 10000, 512, 'sha512');
  return hash.toString('base64');
}

export const createUser = (username: string, password: string): User => {
  const existingUser = findUserByUsername.get(username);
  if (existingUser) {
    throw new Error('User with username already exists.');
  }

  const user: User = {
    id: generateId(),
    username,
    password: hashPassword(password),
  };

  insertUser.run(user.id, user.username, user.password);
  return user;
};

export const createToken = (userId: string, clientId: string): Array<string> => {
  const accessToken = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();
  insertToken.run(accessToken, refreshToken, clientId, userId);
  return [accessToken, refreshToken];
};

export const getUser = (username: string, password: string): User => {
  const user = findUserByUsernameAndPassword.get(username, hashPassword(password));

  return user ? {
    id: user.id,
    username: user.username,
  } as User : null;
};

export const getUserByAccessToken = (token: string): User => {
  const user = findUserByAccessToken.get(token);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
  } as User;
};

export const createExperience = (userId: string, experience: Experience): string => {
  const experienceId = generateId();
  insertExperience.run(experienceId, userId, experience.name, experience.description, experience.url, experience.qrCodeUrl);

  experience.triggers?.forEach((trigger) => {
    insertExperienceTrigger.run(generateId(), experienceId, trigger.key, trigger.label);
  });

  experience.fields?.forEach((field) => {
    const fieldId = generateId();
    insertExperienceField.run(fieldId, experienceId, field.key, field.label, field.defaultValue, field.isText);

    field.options?.forEach((option) => {
      insertExperienceFieldOption.run(generateId(), experienceId, fieldId, option.value, option.label);
    });
  });

  return experienceId;
};

const populateExperience = (obj: any): Experience => {
  if (!obj) { return null; }

  const experience = {
    id: obj.id,
    name: obj.name,
    description: obj.description,
    url: obj.url,
    qrCodeUrl: obj.qrCodeUrl,
  } as Experience;

  experience.triggers = findExperienceTriggers.all(experience.id).map((trigger) => ({
    id: trigger.id,
    key: trigger.key,
    label: trigger.label,
  } as Trigger));

  experience.fields = findExperienceFields.all(experience.id).map((f) => {
    const field = {
      id: f.id,
      key: f.key,
      label: f.label,
      defaultValue: f.defaultValue,
      isText: !!f.isText,
    } as Field;

    field.options = findFieldOptions.all(field.id).map((option) => ({
      id: option.id,
      value: option.value,
      label: option.label,
    } as FieldOption));

    return field;
  });

  return experience;
};

export const getExperiences = (userId: string): Array<Experience> => {
  return findExperiencesByUserId.all(userId).map(populateExperience);
};

export const getExperience = (userId: string, experienceId: string): Experience => {
  return populateExperience(findExperienceById.get(userId, experienceId));
};
