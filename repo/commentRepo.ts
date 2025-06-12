import { comments } from '../data';
import { Comment } from '../src/__generated__/types'


export const commentRepo = {
    getComments: () => {
        return comments;
    },
    getCommentsByPostId: (id: string): Comment[] => {
        console.log(`[commentRepo] getUserByPostId(${id}) called`);

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
};