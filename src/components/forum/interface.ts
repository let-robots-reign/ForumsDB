export interface IForum {
    posts?: number;
    slug: string;
    threads?: number;
    title: string;
    user: string | number;
}

export interface IGetForumData {
    slug: string;
    limit: number;
    since?: string;
    desc: boolean;
}
