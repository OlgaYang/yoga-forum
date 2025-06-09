import SchemaBuilder from '@pothos/core';
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';
import { User, Post } from './types';
import DataLoaderPlugin from '@pothos/plugin-dataloader';
import DataLoader from 'dataloader';
import { PubSub } from 'graphql-subscriptions';
import { pubSub } from './pubsub';

//metrics
import TracingPlugin, { wrapResolver, isRootField } from '@pothos/plugin-tracing';

// complexity
import ComplexityPlugin from '@pothos/plugin-complexity';

// smart sub
import SmartSubscriptionsPlugin, {
    subscribeOptionsFromIterator,
} from '@pothos/plugin-smart-subscriptions';

export interface ContextType {
    pubSub: PubSub;
    loadUsersById: DataLoader<string, User | Error>;
    loadPostsByAuthorIds: DataLoader<string, Post[] | Error>;
}

const builder = new SchemaBuilder<{
    Context: ContextType;
}>({
    plugins: [DataLoaderPlugin, TracingPlugin, ComplexityPlugin, SmartSubscriptionsPlugin],
    tracing: {

        default: (config) => true,
        wrap: (resolver, options, config) =>
            wrapResolver(resolver, (error, duration) => {
                const message = `Executed resolver ${config.parentType}.${config.name} in ${duration}ms`;
                console.log(message);
            }),
    },
    smartSubscriptions: {
        ...subscribeOptionsFromIterator((name) => pubSub.asyncIterableIterator(name)),
    },
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
            resolve: (parent, args, ctx) => {
                ctx.pubSub.publish('USER_GOT', "tset");
                return userRepo.getUserById(args.id)
            }
        }),
    }),
});

builder.queryFields((t) => ({
    countManyUser: t.field({
        type: 'Int',
        smartSubscription: true,
        subscribe: (subscriptions) => {
            subscriptions.register('POST_CREATED')
            subscriptions.register('USER_GOT')
        },
        resolve: (_root, _args, ctx) => 9999,
    }),
}));

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

export const schema = builder.toSchema({
    complexity: {
        limit: {
            complexity: 500,
            depth: 3,
            breadth: 5,
        },

    },
});
