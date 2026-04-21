import Koa from 'koa';
import Router from '@koa/router';

import { validateJwt, validateToken } from './middleware.ts';
import { isValidClient, getJwt } from './auth.ts';

import {
  createUser,
  createToken,
  getUser,
  createExperience,
  getExperiences,
  getExperience,
  refreshToken,
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

// Skipping a few steps to make this proper oauth, but serves the purpose of getting
// some tokens for testing.
router.post('/oauth', validateJwt, (ctx: Koa.Context) => {
  const { clientId, clientSecret } = ctx.request.body;

  const user: User = ctx.state.user;

  if (!isValidClient(clientId, clientSecret)) {
    ctx.status = 403;
    return;
  }

  // Return the tokens straight away instead of using an authorization code + redirect flow.
  const [accessToken, refreshToken] = createToken(user.id, clientId);

  ctx.body = {
    accessToken: btoa(accessToken),
    refreshToken: btoa(refreshToken),
    expiresIn: 3600, // 1 hour in seconds
  }
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
//   https://<<domain>>/api
router.get('/api/experiences', validateToken, (ctx: Koa.Context) => {
  const user: User = ctx.state.user;

  const experiences = getExperiences(user.id)

  ctx.body = { experiences };
});

// Get Experience by ID via access token.
// This endpoint will be used by Tagboard via the provided URL:
//   https://<<domain>>/api
router.get('/api/experiences/:id', validateToken, (ctx: Koa.Context) => {
  const user: User = ctx.state.user;
  const id: string = ctx.params.id;

  const experience = getExperience(user.id, id);

  if (!experience) {
    ctx.status = 404;
    return
  }

  ctx.body = experience;
});

/**************************************/
/* Token Refresh Endpoint (PDK)      */
/**************************************/

// Refresh an expired access token using a refresh token.
// This endpoint will be used by Tagboard via the provided refreshPath URL.
router.post('/refresh', (ctx: Koa.Context) => {
  const { refresh_token: refreshTokenValue } = ctx.request.body;

  if (!refreshTokenValue) {
    ctx.status = 400;
    ctx.body = { error: 'refresh_token is required' };
    return;
  }

  try {
    const { accessToken, expiresIn } = refreshToken(refreshTokenValue);

    ctx.body = {
      access_token: accessToken,
      expires: expiresIn,
    };
    ctx.status = 200;
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: err?.message || 'Invalid refresh token' };
  }
});

export default router;
