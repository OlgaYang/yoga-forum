// import { createYoga } from 'graphql-yoga';
// import http from 'http';
// import { schema } from './schema';
// import DataLoader from 'dataloader';
// import { userRepo } from '../repo/userRepo';
// import { postRepo } from '../repo/postRepo';

// // subscription

// import { useServer } from 'graphql-ws/lib/use/ws';
// import { WebSocketServer } from 'ws';
// import { pubSub } from './pubsub';


// // metrics
// import { usePrometheus } from '@graphql-yoga/plugin-prometheus'


// const context = () => ({
//     pubSub,
//     loadUsersById: new DataLoader(userRepo.batchGetUsersById),
//     loadPostsByAuthorIds: new DataLoader(postRepo.getPostsByAuthorIds1)
// });

// const yoga = createYoga({
//     schema, context,
//     plugins: [
//         schema, // Provide your GraphQL schema
//         usePrometheus({
//             endpoint: '/metrics', // optional, default is `/metrics`, you can disable it by setting it to `false` if registry is configured in "push" mode
//             // Optional, see default values below
//             metrics: {
//                 // By default, these are the metrics that are enabled:
//                 graphql_envelop_request_time_summary: true,
//                 graphql_envelop_phase_parse: true,
//                 graphql_envelop_phase_validate: true,
//                 graphql_envelop_phase_context: true,
//                 graphql_envelop_phase_execute: true,
//                 graphql_envelop_phase_subscribe: true,
//                 graphql_envelop_error_result: true,
//                 graphql_envelop_deprecated_field: true,
//                 graphql_envelop_request_duration: true,
//                 graphql_envelop_schema_change: true,
//                 graphql_envelop_request: true,
//                 graphql_yoga_http_duration: true,

//                 // This metric is disabled by default.
//                 // Warning: enabling resolvers level metrics will introduce significant overhead
//                 graphql_envelop_execute_resolver: true
//             }
//         })
//     ]

// });

// const server = http.createServer(yoga);
// const wsServer = new WebSocketServer({
//     server: server,
//     path: '/graphql',
// });

// useServer({ schema, context, }, wsServer);

// server.listen(4000, () => {
//     console.log('🚀 Server ready at http://localhost:4000/graphql');
// });



//////


import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { gql } from "graphql-tag";
import { readFileSync } from "fs";
import { Resolvers } from './__generated__/types';
import { Post } from './types';

import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';
import { commentRepo } from '../repo/commentRepo';

import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection'

const typeDefs = gql(readFileSync("./schema.graphql", "utf8"));
//query, mutation, sub
const resolvers: Resolvers = {
  Query: {
    posts: () => postRepo.getAllPosts(),
  },
  Mutation: {
    addComment: (_, { userId, postId, content }) => commentRepo.addComment(userId, postId, content),
  },
  Post: {
    id: (parent) => parent.id,
    content: (parent) => parent.content,
    author: (parent) => {
      return userRepo.getUserById(parent.author.id)
    },
    comments: (parent) => {
      return commentRepo.getCommentsByPostId(parent.id)
    }
  },
  User: {
    id: (parent) => parent.id,
    nickname: (parent) => parent.nickname,
    image: (parent) => parent.image ?? null,
    posts: (parent) => postRepo.getPostsByAuthorId(parent.id)
  },
  Comment: {
    id: (parent) => parent.id,
    content: (parent) => parent.content,
    author: (parent) => userRepo.getUserById(parent.author.id),
    post: (parent) => postRepo.getPostById(parent.post.id)
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  // graphiql: false,
  // plugins: [useDisableIntrospection()]
});


const server = createServer(yoga);
server.listen(4000, () => {
  console.log('🚀 Yoga server running at http://localhost:4000/graphql');
});