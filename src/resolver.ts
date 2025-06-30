import { Resolvers, Post } from './__generated__/types';

import { postRepo } from '../repo/postRepo';
import { commentRepo } from '../repo/commentRepo';
import { pubSub } from './pubsub';
import { CommentMapper, PostMapper, UserMapper } from './types';


const POST_CREATED = 'POST_CREATED';

export const resolvers: Resolvers = {
    Query: {
        posts: (_, args): PostMapper[] => postRepo.getAllPosts(args),
        comments: async (_, args, context) => await context.comments.load({ postId: args.postId, args })
    },
    Mutation: {
        addComment: (_, { postId, content }, context) => commentRepo.addComment(context.user.id, postId, content),
        createPost: async (_, { content }, context) => {
            const post = await postRepo.createPost(context.user.id, content)
            pubSub.publish(POST_CREATED, post)
            return post;
        },        
    },
    Subscription: {
        postCreated: {
            subscribe: () => pubSub.asyncIterableIterator(POST_CREATED),
            resolve: (post: PostMapper) => post,
        },       
    },
    Post: {
        id: (parent) => parent.id,
        content: (parent) => parent.content ?? null,
        author: async (parent: PostMapper, _, context) => context.users.load(parent.authorId),
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
        author: async (parent: CommentMapper, _, context) => context.users.load(parent.authorId),
        post: async (parent: CommentMapper, _, context) => context.post.load(parent.postId)
    }
};