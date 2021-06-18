import {QueryResult} from 'pg';

export interface IQuery {
    name: string;
    text: string;
    values: (string | number)[];
    rowMode?: string;
}

export interface IReturnQuery {
    data: QueryResult;
    isError: boolean;
    code: number;
    message: string;
}

export interface IReturn<T> {
    data: T;
    error: boolean;
}

export interface IError {
    message: string;
}
