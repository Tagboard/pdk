import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'My Super Cool & Secure JWT Secret';

export const getJwt = (obj: any = {}): string => jwt.sign(obj, SECRET);
export const verifyJwt = (token: string): any => jwt.verify(token, SECRET);
