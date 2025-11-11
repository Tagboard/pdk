import Koa from 'koa';

import { verifyJwt } from './auth.ts';
import { getUserByAccessToken } from './db.ts';

const getBearerToken = (ctx: Koa.Context): string => {
  let auth = ctx.headers['Authorization'] || ctx.headers['authorization'];
  auth = Array.isArray(auth) ? auth[0] : auth;
  const [, token] = auth ? auth.match(/Bearer (.*)/) : [];
  return token;
};

export const validateJwt = async (ctx: Koa.Context, next: Koa.Next) => {
  const token = getBearerToken(ctx);
  if (!token) {
    ctx.status = 401;
    return;
  }

  const user = verifyJwt(token);
  if (!user || !user.id) {
    ctx.status = 401;
    return;
  }

  ctx.state.user = user;
  await next();
};

export const validateToken = async (ctx: Koa.Context, next: Koa.Next) => {
  const token = getBearerToken(ctx);
  if (!token) {
    ctx.status = 401;
    return;
  }

  const accessToken = atob(token);
  const user = getUserByAccessToken(accessToken);
  if (!user || !user.id) {
    ctx.status = 401;
    return;
  }

  ctx.state.user = user;
  await next();
}
