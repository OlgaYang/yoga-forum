import SchemaBuilder from '@pothos/core';
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';
import { User, Post } from './types';
import DataLoaderPlugin from '@pothos/plugin-dataloader';
import DataLoader from 'dataloader';
import { PubSub } from 'graphql-subscriptions';

export interface ContextType {
    pubSub: PubSub;
    loadUsersById: DataLoader<string, User | Error>;
    loadPostsByAuthorIds: DataLoader<string, Post[] | Error>;
}

const builder = new SchemaBuilder<{
    Context: ContextType;
}>({
    plugins: [DataLoaderPlugin],
});

const User = builder.loadableObject('User', {
    load: (ids: string[], context: ContextType) => context.loadUsersById.loadMany(ids),
    fields: (t) => ({
        id: t.exposeID('id'),
        nickname: t.exposeString('nickname'),
        image: t.exposeString('image'),
    }),
});

// 1. one-to-many relations: return post[][]
// builder.objectField(User, 'posts', (t) =>
//     t.loadableList({
//         type: Post,
//         load: (ids: string[], context) => context.loadPostsByAuthorIds.loadMany(ids),
//         resolve: (user, args) => user.id
//     }),
// );

// 2. on-to-many relations: return post[]
builder.objectField(User, 'posts', (t) =>
    t.loadableGroup({
        type: Post,
        load: (ids: string[], context) => postRepo.getPostsByAuthorIds1(ids),
        group: (post) => post.authorId,
        resolve: (user, args) => user.id
    }),
);

const Post = builder.objectRef<Post>('Post')
    .implement({
        fields: (t) => ({
            id: t.exposeID('id'),
            content: t.exposeString('content'),
        }),
    });

builder.objectField(Post, 'author', (t) =>
    t.loadable({
        type: User,
        load: (ids: string[], context) => context.loadUsersById.loadMany(ids),
        resolve: (post, args) => post.authorId
    }),
);

builder.queryType({
    fields: (t) => ({
        posts: t.field({
            type: [Post],
            resolve: () => postRepo.getAllPosts(),
        }),
        user: t.field({
            type: User,
            args: {
                id: t.arg.id({ required: true }),
            },
            resolve: (parent, args, ctx) => userRepo.getUserById(args.id),
        }),
    }),
});

builder.mutationType({
    fields: (t) => ({
        createPost: t.field({
            type: Post,
            args: {
                authorId: t.arg.string({ required: true }),
                content: t.arg.string({ required: true }),
            },
            resolve: async (root, args, ctx) => {
                const post = {
                    content: args.content,
                    authorId: args.authorId
                };

                var newPost = await postRepo.createPost(post)
                ctx.pubSub.publish('POST_CREATED', newPost);
                return newPost
            },
        }),
    })
})

builder.subscriptionType({
    fields: (t) => ({
        postCreated: t.field({
            type: Post,
            subscribe: (_parent, _args, ctx) => ctx.pubSub.asyncIterableIterator('POST_CREATED'),
            resolve: (post: Post) => post,
        }),
    }),
});

export const schema = builder.toSchema({});
