import { Resolvers } from './__generated__/types';

import { postRepo } from '../repo/postRepo';
import { commentRepo } from '../repo/commentRepo';

export const resolvers: Resolvers = {
    Query: {
        posts: () => postRepo.getAllPosts(),
    },
    Mutation: {
        addComment: (_, { userId, postId, content }) => commentRepo.addComment(userId, postId, content),
        createPost: (_, { userId, content }) => postRepo.createPost({ content: content, author: { id: userId } as any })
    },
    Post: {
        id: (parent) => parent.id,
        content: (parent) => parent.content,
        author: (parent, _, context) => context.users.load(parent.author.id),
        comments: (parent, _, context) => context.comments.load(parent.id)
    },
    User: {
        id: (parent) => parent.id,
        nickname: (parent) => parent.nickname,
        image: (parent) => parent.image ?? null,
        posts: (parent, _, context) => context.posts.load(parent.id)
    },
    Comment: {
        id: (parent) => parent.id,
        content: (parent) => parent.content,
        author: (parent, _, context) => context.users.load(parent.author.id),
        post: (parent, _, context) => context.post.load(parent.post.id)
    }
};