import { createYoga } from 'graphql-yoga';
import http from 'http';
import { schema } from './schema';
import DataLoader from 'dataloader';
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';

const yoga = createYoga({
    schema,
    context: () => ({
        loadUsersById: new DataLoader(userRepo.batchGetUsersById),
        loadPostsByAuthorIds: new DataLoader(postRepo.getPostsByAuthorIds1)
    }),
});

const server = http.createServer(yoga);

server.listen(4000, () => {
    console.log('🚀 Server ready at http://localhost:4000/graphql');
});

