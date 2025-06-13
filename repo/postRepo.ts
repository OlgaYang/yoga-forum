import { posts, nextPostId as getNextPostId, } from '../src/data';
import { Post as PostDB } from '../src/types';
import { Post, QueryPostsArgs, SortOrder } from '../src/__generated__/types'


export const postRepo = {
    getAllPosts: (args: QueryPostsArgs) => {

        const sorted = [...posts].sort((a, b) => {
            if (args.order === SortOrder.Asc) {
                return a.id.localeCompare(b.id); // 假設 id 是字串型別
            } else {
                return b.id.localeCompare(a.id);
            }
        });

        const sliced = typeof args.first === 'number' ? sorted.slice(0, args.first) : sorted;

        return sliced.map((post): Post => ({
            id: post.id,
            content: post.content,
            author: { id: post.authorId } as any,
        }));
    },

    batchGetPostsByAuthorId: (ids: readonly string[]) => {

        const map = new Map<string, PostDB[]>();
        for (const id of ids) map.set(id, []);
        for (const post of posts) {
            map.get(post.authorId)?.push(post);
        }

        return Promise.resolve(ids.map((id) => map.get(id)));
    },

    batchGetPostById: (ids: readonly string[]): Promise<PostDB[]> => {
        const result = ids.map((id) => {
            const post = posts.find((p) => p.id === id);
            return post as PostDB;
        })

        return Promise.resolve(result)
    },
    createPost: (authorId: string, content: string): Promise<Post> => {
        const newId = String(getNextPostId() + 1)
        const newPostDB: PostDB = {
            id: newId,
            authorId: authorId,
            content: content
        };
        posts.push(newPostDB);

        const newPost: Post = {
            id: newId,
            content: content
        }

        return Promise.resolve(newPost);
    },
};
