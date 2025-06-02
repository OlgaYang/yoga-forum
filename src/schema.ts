import SchemaBuilder from '@pothos/core';
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';
import { User, Post } from './types';
import DataLoaderPlugin from '@pothos/plugin-dataloader';
import DataLoader from 'dataloader';

export interface ContextType {
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

export const schema = builder.toSchema({});
