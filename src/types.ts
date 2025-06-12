export type Post = {
    id: string;
    content: string;
    authorId: string;
};

export type User = {
    id: string;
    nickname: string;
    image: string;
};


export type Comment = {
    id: string;
    content: string;
    authorId: string;
    postId: string;
};