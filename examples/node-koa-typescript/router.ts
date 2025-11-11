import Koa from 'koa';
import Router from '@koa/router';

import { validateJwt, validateToken } from './middleware.ts';
import { getJwt } from './auth.ts';

import {
  createUser,
  getUser,
  createExperience,
  getExperiences,
  getExperience,
} from './db.ts';

const router = new Router();

router.get('/ping', (ctx: Koa.Context) => {
  ctx.body = 'pong';
  ctx.status = 200;
});

/****************************/
/* Authentication Endpoints */
/****************************/

// Create new account and return JWT.
router.post('/register', (ctx: Koa.Context) => {
  const {
    username = '',
    password = '',
  } = ctx.request.body;

  if (!username || !password) {
    ctx.status = 400;
    ctx.body = 'Must provide both username and password to register.';
    return;
  }

  let user;
  try {
    user = createUser(username, password);
  } catch (err) {
    ctx.status = 400;
    ctx.body = err?.message || 'Failed to register user.';
    return;
  }

  if (!user) {
    ctx.status = 400;
    ctx.body = 'Failed to register user.';
    return;
  }

  ctx.body = {
    jwt: getJwt(user),
  };
});

// Validate credentials and return JWT.
router.post('/login', (ctx: Koa.Context) => {
  const {
    username = '',
    password = '',
  } = ctx.request.body;

  if (!username || !password) {
    ctx.status = 400;
    ctx.body = 'Must provide both username and password to login.'
    return;
  }

  const user = getUser(username, password);
  if (!user) {
    ctx.status = 400;
    ctx.body = 'No user matching credentials found.'
    return;
  }

  ctx.body = {
    jwt: getJwt(user),
  };
});

/*************************************/
/* Internal Endpoints (JWT Required) */
/*************************************/

// Generate new tokens for provided app.
router.post('/oauth', validateJwt, (ctx: Koa.Context) => {
  ctx.status = 501;
});

// Create a new Experience.
router.post('/experiences', validateJwt, (ctx: Koa.Context) => {
  const experience: Experience = ctx.request.body;
  const user: User = ctx.state.user;

  const id = createExperience(user.id, experience);

  ctx.body = { id };
  ctx.status = 201;
});

// Get list of Experiences
router.get('/experiences', validateJwt, (ctx: Koa.Context) => {
  const user: User = ctx.state.user;

  const experiences = getExperiences(user.id)

  ctx.body = { experiences };
});

// Get Experience by ID
router.get('/experiences/:id', validateJwt, (ctx: Koa.Context) => {
  const user: User = ctx.state.user;
  const id: string = ctx.params.id;

  const experience = getExperience(user.id, id);

  ctx.body = experience;
});

// Update an Experience by ID.
router.put('/experiences/:id', validateJwt, (ctx: Koa.Context) => {
  ctx.status = 501;
});

// Delete an Experience by ID.
router.delete('/experiences/:id', validateJwt, (ctx: Koa.Context) => {
  ctx.status = 501;
});

/*****************************************/
/* PDK Endpoints (Access Token Required) */
/*****************************************/

// Get list of Experiences by account via access token.
// This endpoint will be used by Tagboard via the provided URL:
//   https://<<domain>>/pdk
router.get('/pdk/experiences', validateToken, (ctx: Koa.Context) => {
  ctx.status = 501;
});

// Get Experience by ID via access token.
// This endpoint will be used by Tagboard via the provided URL:
//   https://<<domain>>/pdk
router.get('/pdk/experiences/:id', validateToken, (ctx: Koa.Context) => {
  ctx.status = 501;
});

export default router;
