import { posts, nextPostId as getNextPostId, } from '../src/data';
import { Post as PostDB } from '../src/types';
import { Post } from '../src/__generated__/types'


export const postRepo = {
    getAllPosts: () => {

        return posts.map((post): Post => ({
            id: post.id,
            content: post.content,
            author: { id: post.authorId } as any, // 還沒 resolve，後面再補

        }));
    },
    getPostsByAuthorId: (authorId: string) => {
        const authorPosts = posts.filter((p) => p.authorId === authorId);

        return authorPosts.map((post): Post => ({
            id: post.id,
            content: post.content,
            author: { id: post.authorId } as any, // 還沒 resolve，後面再補

        }));
    },

    getPostsByAuthorIds: (ids: readonly string[]) => {

        const map = new Map<string, any[]>();
        for (const id of ids) map.set(id, []);
        for (const post of posts) {
            map.get(post.authorId)?.push(post);
        }

        return Promise.resolve(ids.map((id) => map.get(id)));
    },
    getPostsByAuthorIds1: (ids: readonly string[]) => {

        const result: any[] = [];

        for (const post of posts) {
            if (ids.includes(post.authorId)) {
                result.push(post);
            }
        }

        return Promise.resolve(result);
    },
    getPostById: (id: string): Post => {
        const post = posts.find((p) => p.id === id);
        return {
            ...post,
            author: { id: post?.authorId } as any
        } as Post
    },
    createPost: (post: Omit<Post, 'id'>): Promise<Post> => {

        const newId = String(getNextPostId() + 1)
        const newPostDB: PostDB = {
            id: newId,
            authorId: post.author.id,
            ...post,
        };
        posts.push(newPostDB);

        const newPost: Post = {
            id: newId,
            ...post
        }

        return Promise.resolve(newPost);
    },

};
