import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'My Super Cool & Secure JWT Secret';

export const getJwt = (obj: any = {}): string => jwt.sign(obj, SECRET);
export const verifyJwt = (token: string): any => jwt.verify(token, SECRET);

// Normally would validate clientId and clientSecret, but we'll assume they are valid
// for the sake of this example. This isn't a production app after all.
export const isValidClient = (clientId: string, clientSecret: string) => !!(clientId && clientSecret);
