import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
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
import { WebSocketServer } from 'ws';
import { pubSub } from './pubsub';

// metric
import { usePrometheus } from '@graphql-yoga/plugin-prometheus'
// max depth
import { envelop, useEnvelop, useValidationRule } from '@envelop/core'
import { depthLimit } from '@graphile/depth-limit'

import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'


const typeDefs = gql(readFileSync("./schema.graphql", "utf8"));
const schema = makeExecutableSchema({ typeDefs, resolvers });


const plugins = [
  useDataLoader('users', () => new DataLoader(userRepo.batchGetUsersById)),
  useDataLoader('posts', () => new DataLoader(postRepo.batchGetPostsByAuthorId)),
  useDataLoader('post', () => new DataLoader(postRepo.batchGetPostById)),
  useDataLoader('comments', () => new DataLoader(commentRepo.batchGetCommentsByPostId)),
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
  useEnvelop(envelop({
    plugins: [
      useValidationRule(
        depthLimit({
          maxDepth: 6,
        })
      )
    ]
  })),
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
  graphiql: process.env.NODE_ENV === 'production',
});

const server = createServer(yoga);
const wsServer = new WebSocketServer({
  server: server,
  path: '/graphql',
});

useServer(
  {
    schema: yoga.getEnveloped().schema,
    execute: yoga.getEnveloped().execute,
    subscribe: yoga.getEnveloped().subscribe,
    context: yoga.getEnveloped().contextFactory,
  },
  wsServer
);

server.listen(4000, () => {
  console.log('🚀 Yoga server running at http://localhost:4000/graphql');
});
