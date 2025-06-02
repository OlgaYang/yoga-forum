import SchemaBuilder from '@pothos/core';
import { userRepo } from '../repo/userRepo';
import { postRepo } from '../repo/postRepo';
import { User, Post } from './types';

const builder = new SchemaBuilder({});

const UserRef = builder.objectRef<User>('User');
const PostRef = builder.objectRef<Post>('Post');

PostRef.implement({
    fields: (t) => ({
        id: t.exposeID('id'),
        content: t.exposeString('content'),
        author: t.field({
            type: UserRef,
            resolve: (post) => userRepo.getUserById(post.authorId)!,
        }),
    }),
});

UserRef.implement({
    fields: (t) => ({
        id: t.exposeID('id'),
        nickname: t.exposeString('nickname'),
        image: t.exposeString('image', { nullable: true }),
        posts: t.field({
            type: [PostRef],
            resolve: (user) => postRepo.getPostsByAuthorId(user.id),
        }),
    }),
});

builder.queryType({
    fields: (t) => ({
        users: t.field({
            type: [UserRef],
            resolve: () => userRepo.getAllUsers(),
        }),
        posts: t.field({
            type: [PostRef],
            resolve: () => postRepo.getAllPosts(),
        }),
    }),
});


export const schema = builder.toSchema({});
