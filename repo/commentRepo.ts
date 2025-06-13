import { comments, nextCommentId as getNextCommentId } from '../src/data';
import { Comment, PostCommentsArgs, SortOrder } from '../src/__generated__/types'


export const commentRepo = {
    getComments: () => {
        return comments;
    },
    getCommentsByPostId: (id: string): Comment[] => {
        const commentsByPostId = comments
            .filter((comment) => comment.postId === id)
            .map((comment): Comment => ({
                id: comment.id,
                content: comment.content,
                author: { id: comment.authorId } as any, // 先留空，resolver 會補
                post: { id: comment.postId } as any,   // 先留空，resolver 會補
            }));

        return commentsByPostId
    },
    batchGetCommentsByPostId: (keys: readonly { postId: string; args: PostCommentsArgs }[]) => {

        const resultMap = new Map<string, Comment[]>();
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
                filtered.map((comment) => ({
                    ...comment,
                    author: { id: comment.authorId } as any,
                    post: { id: comment.postId } as any,
                }))
            );
        }

        return Promise.resolve(keys.map(({ postId }) => resultMap.get(postId) ?? []));
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