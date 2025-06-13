import { comments, nextCommentId as getNextCommentId } from '../src/data';
import { Comment, PostCommentsArgs, SortOrder } from '../src/__generated__/types'
import { Comment as CommentDb } from '../src/types'


export const commentRepo = {
    getComments: () => {
        return comments;
    },
    batchGetCommentsByPostId: (keys: readonly { postId: string; args: PostCommentsArgs }[]) => {
        const resultMap = new Map<string, CommentDb[]>();
        for (const { postId, args } of keys) {

            let filtered = comments.filter((comment) => comment.postId === postId);

            if (args.authorId && args.authorId.trim() !== '') {
                filtered = filtered.filter((comment) => comment.authorId === args.authorId);
            }

            filtered = filtered.sort((a, b) => {
                return args.order === SortOrder.Asc
                    ? a.id.localeCompare(b.id)
                    : b.id.localeCompare(a.id);
            });

            resultMap.set(
                postId,
                filtered.map((comment) => { return comment })
            );
        }

        return Promise.resolve(keys.map(({ postId }) => resultMap.get(postId) ?? []));
    },
    batchGetCommentById: (ids: readonly string[]): Promise<CommentDb[]> => {
        const result = ids.map((id) => {
            const comment = comments.find((p) => p.id === id);
            return comment as CommentDb;
        })

        return Promise.resolve(result)
    },
    addComment: (userId: string, postId: string, content: string): Comment => {
        const newComment = {
            id: (getNextCommentId() + 1).toString(),
            content,
            authorId: userId,
            postId,
        };
        comments.push(newComment);

        return {
            ...newComment,
            author: { id: newComment.authorId } as any,
            post: { id: postId } as any
        } as Comment
    }
};