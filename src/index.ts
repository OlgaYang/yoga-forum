import { createYoga } from 'graphql-yoga';
import http from 'http';
import { schema } from './schema';
import DataLoader from 'dataloader';
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';

// subscription
import { PubSub } from 'graphql-subscriptions';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';

const pubSub = new PubSub();


const context = () => ({
    pubSub,
    loadUsersById: new DataLoader(userRepo.batchGetUsersById),
    loadPostsByAuthorIds: new DataLoader(postRepo.getPostsByAuthorIds1)
});

const yoga = createYoga({
    schema, context
});

const server = http.createServer(yoga);
const wsServer = new WebSocketServer({
    server: server,
    path: '/graphql',
});

useServer({ schema, context, }, wsServer);

server.listen(4000, () => {
    console.log('🚀 Server ready at http://localhost:4000/graphql');
});

