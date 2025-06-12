import { Post, User, Comment } from './src/types';

export const nextUserId = 3;
export const users: User[] = [
    { id: '1', nickname: 'Olga', image: 'https://example.com/olga.png' },
    { id: '2', nickname: 'Jack', image: 'https://example.com/jack.png' },
];

export const posts: Post[] = [
    { id: '1', content: 'Hello world!', authorId: '1' },
    { id: '2', content: 'Second post', authorId: '1' },
    { id: '3', content: 'Jack says hi', authorId: '2' },
];


export const comments: Comment[] = [
    { id: '1', content: 'New comment!!', authorId: '1', postId: '1' },
];

export const nextPostId = posts.length;