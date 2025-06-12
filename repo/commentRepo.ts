import { comments, nextCommentId as getNextCommentId } from '../src/data';
import { Comment } from '../src/__generated__/types'


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
    batchGetCommentsByPostId: (ids: readonly string[]) => {
        const map = new Map<string, any[]>();
        for (const id of ids) map.set(id, []);
        for (const comment of comments) {
            map.get(comment.postId)?.push({
                ...comment,
                author: { id: comment.authorId } as any,
                post: { id: comment.postId } as any
            } as Comment);
        }

        return Promise.resolve(ids.map((id) => map.get(id)));
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