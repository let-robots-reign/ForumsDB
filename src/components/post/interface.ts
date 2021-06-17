export interface IPost {
    author: string;
    created?: string;
    forum: string | number;
    id?: string;
    isEdited?: boolean;
    message: string;
    parent?: number;
    thread: string | number;
}

export interface IPostFilter {
    threadId: number;
    forum: string;
    limit: number;
    since: number | undefined;
    sort: string;
    desc: boolean;
}

export interface IPostUpdate {
    id: number;
    message: string;
}
