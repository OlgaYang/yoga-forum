import { Post, User } from './src/types';

export const users: User[] = [
    { id: '1', nickname: 'Olga', image: 'https://example.com/olga.png' },
    { id: '2', nickname: 'Jack', image: 'https://example.com/jack.png' },
];

export const posts: Post[] = [
    { id: 'a', content: 'Hello world!', authorId: '1' },
    { id: 'b', content: 'Second post', authorId: '1' },
    { id: 'c', content: 'Jack says hi', authorId: '2' },
];