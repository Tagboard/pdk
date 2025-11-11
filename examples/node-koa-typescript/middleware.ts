import Koa from 'koa';

import { verifyJwt } from './auth.ts';

export const validateJwt = async (ctx: Koa.Context, next: Koa.Next) => {
  let auth = ctx.headers['Authorization'] || ctx.headers['authorization'];
  auth = Array.isArray(auth) ? auth[0] : auth;
  const [, token] = auth.match(/Bearer (.*)/);

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
  // TODO: Implement
  await next();
}
