import { posts } from '../data';

export const postRepo = {
    getAllPosts: () => {
        console.log('[postRepo] getAllPosts called');
        return posts;
    },
    getPostsByAuthorId: (authorId: string) => {
        console.log(`[postRepo] getPostsByAuthorId(${authorId}) called`);
        return posts.filter((p) => p.authorId === authorId);
    },
};
