import Koa from 'koa';
import Router from '@koa/router';

import { validateJwt, validateToken } from './middleware.ts';

const router = new Router();

router.get('/ping', (ctx: Koa.Context) => {
  ctx.body = 'pong';
  ctx.status = 200;
});

/****************************/
/* Authentication Endpoints */
/****************************/

// Create new account and return JWT.
router.post('/signup', (ctx: Koa.Context) => {
  ctx.status = 501;
});

// Validate credentials and return JWT.
router.post('/login', (ctx: Koa.Context) => {
  ctx.status = 501;
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
  ctx.status = 501;
});

// Get list of Experiences
router.get('/experiences', validateJwt, (ctx: Koa.Context) => {
  ctx.status = 501;
});

// Get Experience by ID
router.get('/experiences/:id', validateJwt, (ctx: Koa.Context) => {
  ctx.status = 501;
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
