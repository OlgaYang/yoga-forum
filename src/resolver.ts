import { Resolvers } from './__generated__/types';
import { Post } from './types';

import { userRepo } from '../repo/userRepo';
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