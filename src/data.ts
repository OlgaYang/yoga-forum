import { PostMapper, UserMapper, CommentMapper } from './types';

export const users: UserMapper[] = [
    { id: '1', nickname: 'Olga', image: 'https://example.com/olga.png' },
    { id: '2', nickname: 'Jack', image: 'https://example.com/jack.png' },
    { id: 'cd2tFvZ5G8WZcpA0sAREuTMUPm22', nickname: 'Andy', image: 'https://example.com/andy.png' },
    { id: '6wxsEILG9rNRSjUVLLrRwDjum8Z2', nickname: 'Mary', image: 'https://example.com/mary.png' },
];

export const posts: PostMapper[] = [
    { id: '1', content: 'Hello world!', authorId: '1' },
    { id: '2', content: 'Second post', authorId: '1' },
    { id: '3', content: 'Jack says hi', authorId: '2' },
];

export const comments: CommentMapper[] = [
    { id: '1', content: 'New comment!!', authorId: '1', postId: '1' },
];

export const nextCommentId = () => comments.length;
export const nextPostId = () => posts.length;