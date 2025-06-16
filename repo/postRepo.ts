import { posts, nextPostId as getNextPostId, } from '../src/data';
import { PostMapper } from '../src/types';
import { QueryPostsArgs, SortOrder } from '../src/__generated__/types'


export const postRepo = {
    getAllPosts: (args: QueryPostsArgs): PostMapper[] => {
        const sorted = [...posts].sort((a, b) => {
            if (args.order === SortOrder.Asc) {
                return a.id.localeCompare(b.id);
            } else {
                return b.id.localeCompare(a.id);
            }
        });

        return typeof args.first === 'number' ? sorted.slice(0, args.first) : sorted;
    },

    batchGetPostsByAuthorId: (ids: readonly string[]): Promise<PostMapper[][]> => {

        const map = new Map<string, PostMapper[]>();
        for (const id of ids) map.set(id, []);
        for (const post of posts) {
            map.get(post.authorId)?.push(post);
        }

        const result = ids.map((id) => map.get(id) ?? []);
        return Promise.resolve(result);
    },

    batchGetPostById: (ids: readonly string[]): Promise<PostMapper[]> => {
        const result = ids.map((id) => {
            const post = posts.find((p) => p.id === id);
            return post as PostMapper;
        })

        return Promise.resolve(result)
    },
    createPost: (authorId: string, content: string): Promise<PostMapper> => {
        const newId = String(getNextPostId() + 1)
        const newPostMapper: PostMapper = {
            id: newId,
            authorId: authorId,
            content: content
        };
        posts.push(newPostMapper);

        return Promise.resolve(newPostMapper);
    },
};
