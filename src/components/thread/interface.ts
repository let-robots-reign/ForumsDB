export interface IThread {
    author: string | number;
    created: string;
    forum: string | number;
    message: string;
    slug: string;
    title: string;
    id?: number;
    votes?: number;
}

export interface IThreadUpdate {
    id: number;
    message: string;
    title: string;
}

export interface IThreadData {
    threadId: number;
    forum: string;
}
