export type PostMapper = {
    id: string;
    content: string;
    authorId: string;
};

export type UserMapper = {
    id: string;
    nickname: string;
    image: string;
};


export type CommentMapper = {
    id: string;
    content: string;
    authorId: string;
    postId: string;
};