import { posts, nextPostId, } from '../data';
import { Post } from '../src/types';


export const postRepo = {
    getAllPosts: () => {
        console.log('[postRepo] getAllPosts called');
        return posts;
    },
    getPostsByAuthorId: (authorId: string) => {
        console.log(`[postRepo] getPostsByAuthorId(${authorId}) called`);
        return posts.filter((p) => p.authorId === authorId);
    },

    getPostsByAuthorIds: (ids: readonly string[]) => {
        console.log(`[postRepo] getPostsByAuthorId(${ids}) called`);

        const map = new Map<string, any[]>();
        for (const id of ids) map.set(id, []);
        for (const post of posts) {
            map.get(post.authorId)?.push(post);
        }

        return Promise.resolve(ids.map((id) => map.get(id)));
    },
    getPostsByAuthorIds1: (ids: readonly string[]) => {
        console.log(`[postRepo] getPostsByAuthorIds1(${ids}) called`);

        const result: any[] = [];

        for (const post of posts) {
            if (ids.includes(post.authorId)) {
                result.push(post);
            }
        }

        return Promise.resolve(result);
    },
    createPost: (post: Omit<Post, 'id'>): Promise<Post> => {

        const newPost: Post = {
            id: String(nextPostId + 1),
            ...post,
        };
        posts.push(newPost);
        console.log('[postRepo] Created post:', newPost);
        return Promise.resolve(newPost);
    },

};
