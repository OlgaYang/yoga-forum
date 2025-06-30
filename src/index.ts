import { createServer } from 'node:http';
import { createYoga, useExtendContext } from 'graphql-yoga';
import { gql } from "graphql-tag";
import { readFileSync } from "fs";
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolver'

// dataloader
import DataLoader from 'dataloader'
import { useDataLoader } from '@envelop/dataloader'
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';
import { commentRepo } from '../repo/commentRepo';
// subscription
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import { pubSub } from './pubsub';
// metric
import { usePrometheus } from '@graphql-yoga/plugin-prometheus'
// max depth
import { envelop, useEnvelop, useValidationRule } from '@envelop/core'
import { depthLimit } from '@graphile/depth-limit'

import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'
// jwt
import {
  createRemoteJwksSigningKeyProvider,
  extractFromHeader,
  useJWT,
  extractFromConnectionParams
} from '@graphql-yoga/plugin-jwt'
import { PostCommentsArgs } from './__generated__/types';

import { authDirectiveTransformer } from './directives/authDirective'
import { UserMapper } from './types';

// rate limit
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { IncomingMessage } from 'http';


const typeDefs = gql(readFileSync("./schema.graphql", "utf8"));
let schema = makeExecutableSchema({ typeDefs, resolvers });
schema = authDirectiveTransformer(schema)

const firebaseProjectId = "forum-74a03"
const plugins = [  
  useDataLoader('users', () => new DataLoader<string, UserMapper>(userRepo.batchGetUsersById)),
  useDataLoader('posts', () => new DataLoader(postRepo.batchGetPostsByAuthorId)),
  useDataLoader('post', () => new DataLoader(postRepo.batchGetPostById)),
  useDataLoader('comment', () => new DataLoader(commentRepo.batchGetCommentById)),
  useDataLoader('comments', () =>
    new DataLoader(
      (keys: readonly { postId: string; args: PostCommentsArgs }[]) =>
        commentRepo.batchGetCommentsByPostId(keys),
      {
        cacheKeyFn: (key) => JSON.stringify(key)
      }
    )
  ),
  usePrometheus({
    endpoint: '/metrics', // optional, default is `/metrics`, you can disable it by setting it to `false` if registry is configured in "push" mode
    // Optional, see default values below
    metrics: {
      // By default, these are the metrics that are enabled:
      graphql_envelop_request_time_summary: true,
      graphql_envelop_phase_parse: true,
      graphql_envelop_phase_validate: true,
      graphql_envelop_phase_context: true,
      graphql_envelop_phase_execute: true,
      graphql_envelop_phase_subscribe: true,
      graphql_envelop_error_result: true,
      graphql_envelop_deprecated_field: true,
      graphql_envelop_request_duration: true,
      graphql_envelop_schema_change: true,
      graphql_envelop_request: true,
      graphql_yoga_http_duration: true,

      // This metric is disabled by default.
      // Warning: enabling resolvers level metrics will introduce significant overhead
      graphql_envelop_execute_resolver: true
    },

  }),
  // useEnvelop(envelop({
  //   plugins: [
  //     useValidationRule(
  //       depthLimit({
  //         maxDepth: 100,
  //       })
  //     )
  //   ]
  // })),
  useJWT({
    signingKeyProviders: [
      createRemoteJwksSigningKeyProvider({
        jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
      })
    ],
    tokenLookupLocations: [
      extractFromHeader({ name: 'authorization', prefix: 'Bearer' }),
      extractFromConnectionParams({ name: 'token' }),
    ],
    tokenVerification: {
      issuer: `https://securetoken.google.com/${firebaseProjectId}`,
      audience: firebaseProjectId,
      algorithms: ['RS256']
    },
    extendContext: true, // default: inject as `context.jwt`
    reject: {
      missingToken: false,
      invalidToken: false
    },
  }),
  useExtendContext(async (ctx) => {
    const jwt = ctx.jwt
    let user = null
    if (jwt?.payload.sub) {
      user = await userRepo.getUserById(jwt.payload.sub)
    }
    return {
      user
    }
  }),
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(useDisableIntrospection());
}

const yoga = createYoga({
  schema,
  context: () => ({
    pubSub,
  }),
  plugins: plugins,
  graphiql: process.env.NODE_ENV !== 'production',
});

const server = createServer(yoga);
const wsServer = new WebSocketServer({
  server: server,
  path: '/graphql',
  maxPayload: 100,
  verifyClient: function (info, done) {
    //prevent cors
    const origin = info.req.headers.origin;    
    if (origin !== 'http://localhost:5173') {    
      return done(false, 403, 'Forbidden');
    }
    done(true); 
  }
});


const rateLimiter = new RateLimiterMemory(
  {
    points: 5, // 5 points
    duration: 1, // per second
  });
wsServer.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const ip = req.socket.remoteAddress || 'unknown';
  ws.on('message', async () => {
    try {
      await rateLimiter.consume(ip);          
    } catch (rejRes: any) {     
      ws.send(JSON.stringify({ event: 'blocked', retryMs: rejRes.msBeforeNext }));
      ws.close(); 
    }
  });
});

useServer(
  {
    schema: yoga.getEnveloped().schema,
    execute: yoga.getEnveloped().execute,
    subscribe: yoga.getEnveloped().subscribe,
    context: yoga.getEnveloped().contextFactory,
    onConnect: async (ctx) => {
      // verify auth use jwt
      const context = await yoga.getEnveloped().contextFactory({
        connectionParams: ctx.connectionParams,
      });

      if (!context.jwt) {
        return false
      }    

      return true;
    },    
  },
  wsServer
);


server.listen(4000, () => {
  console.log('🚀 Yoga server running at http://localhost:4000/graphql');
});

export default server