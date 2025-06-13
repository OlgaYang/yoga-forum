import { Resolvers, Post } from './__generated__/types';

import { postRepo } from '../repo/postRepo';
import { commentRepo } from '../repo/commentRepo';
import { pubSub } from './pubsub';

const POST_CREATED = 'POST_CREATED';

export const resolvers: Resolvers = {
    Query: {
        posts: (_, args) => postRepo.getAllPosts(args),
        comments: async (_, args, context) => await context.comments.load({ postId: args.postId, args })
    },
    Mutation: {
        addComment: (_, { postId, content }, context) => {
            return commentRepo.addComment(context.user.id, postId, content);
        },
        createPost: async (_, { content }, context) => {
            const post = await postRepo.createPost(context.user.id, content)
            pubSub.publish(POST_CREATED, post)
            return post;
        }
    },
    Subscription: {
        postCreated: {
            subscribe: () => pubSub.asyncIterableIterator(POST_CREATED),
            resolve: (post: Post) => post,
        },
    },
    Post: {
        id: (parent) => parent.id,
        content: (parent) => parent.content ?? null,
        author: async (parent, _, context) => {
            const post = await context.post.load(parent.id)
            return context.users.load(post.authorId);
        },
        comments: async (parent, args, context) => await context.comments.load({ postId: parent.id, args })
    },
    User: {
        id: (parent) => parent.id,
        nickname: (parent) => parent.nickname ?? null,
        image: (parent) => parent.image ?? null,
        posts: async (parent, _, context) => await context.posts.load(parent.id)
    },
    Comment: {
        id: (parent) => parent.id,
        content: async (parent) => parent.content ?? null,
        author: async (parent, _, context) => {
            const comment = await context.comment.load(parent.id)
            return context.users.load(comment.authorId);
        },
        post: async (parent, _, context) => {
            const comment = await context.comment.load(parent.id);
            return context.users.load(comment.postId);
        }
    }
};