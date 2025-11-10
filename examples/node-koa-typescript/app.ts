import Koa from 'koa';
import Router from '@koa/router';

import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';

import router from './router.ts';

const app = new Koa();

// For JSON bodies
app.use(bodyParser({
  parsedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'], // Only parse these methods
}));

app.use(cors());

// Setup API endpoints w/allowed methods (determined automatically).
app
  .use(router.routes())
  .use(router.allowedMethods());

// Log out registered routes
const routeMap: { method: string, path: string }[] = [];

router.stack.forEach((route) => {
  if (route.methods?.length) {
    routeMap.push({
      method: route.methods.filter((m) => m !== 'HEAD').join('|'),
      path: route.path,
    });
  }
});

console.info('\nROUTES:');
console.table(routeMap);
console.info('\n');

export default app;
