SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS CITEXT WITH SCHEMA public;

CREATE FUNCTION public.check_post_parent() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
DECLARE
    _thread INTEGER;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    ELSE
        SELECT INTO _thread thread FROM post WHERE pid = NEW.parent_id;
        IF _thread <> NEW.thread THEN
            RAISE EXCEPTION 'Parent post is in another thread %', NEW.thread USING ERRCODE = '23505';
        ELSE
            RETURN NEW;
        END IF;
    END IF;
END;
$$;

ALTER FUNCTION public.check_post_parent() OWNER TO zotov;

CREATE FUNCTION public.get_post_full(_id INTEGER)
    RETURNS TABLE (post_full json)
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF EXISTS(SELECT 1 FROM post WHERE pid = _id) THEN
        SELECT INTO
            post_full json_build_object(
                'author',
                json_build_object(
                      'about', u.about,
                      'email', u.email,
                      'fullname', u.fullname,
                      'nickname', u.nickname
                  ),
                'forum',
                json_build_object(
                      'posts', f.posts,
                      'slug', f.slug,
                      'threads', f.threads,
                      'title', f.title,
                      'user', f.author
                  ),
                'post',
                json_build_object(
                      'author', p.author,
                      'created', to_char(p.created::timestamptz at time zone 'UTC',
                                         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                      'forum', p.forum,
                      'id', p.pid,
                      'isEdited', p.is_edited,
                      'message', p.message,
                      'parent', p.parent_id,
                      'thread', p.thread
                  ),
                'thread',
                json_build_object(
                      'author', t.author,
                      'created', to_char(t.created::timestamptz at time zone 'UTC',
                                         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                      'forum', t.forum,
                      'id', t.tid,
                      'message', t.message,
                      'slug', t.slug,
                      'title', t.title,
                      'votes', t.votes
                  )
            )
        FROM post p, users u, thread t, forum f
        WHERE p.pid = _id
          AND p.author = u.nickname
          AND p.thread = t.tid
          AND p.forum = f.slug;
        RETURN NEXT;
    ELSE
        RETURN;
    END IF;
END
$$;

ALTER FUNCTION public.get_post_full(_id INTEGER) OWNER TO zotov;

CREATE FUNCTION public.update_post(msg TEXT, _id INTEGER)
    RETURNS TABLE
            (
                author    public.CITEXT,
                created   TIMESTAMP WITH TIME ZONE,
                forum     public.CITEXT,
                id        INTEGER,
                is_edited BOOLEAN,
                message   TEXT,
                parent    INTEGER,
                thread    INTEGER
            )
    LANGUAGE plpgsql
AS
$$
DECLARE
    _message TEXT;
BEGIN
    SELECT INTO _message post.message FROM post WHERE pid = _id;
    IF FOUND THEN
        IF msg <> _message THEN
            UPDATE post
            SET message = msg, is_edited = true
            WHERE pid = _id;
        END IF;

        RETURN QUERY
            SELECT post.author,
                   post.created,
                   post.forum,
                   post.pid       AS id,
                   post.is_edited,
                   post.message,
                   post.parent_id AS parent,
                   post.thread
            FROM post
            WHERE pid = _id;
    ELSE
        RETURN;
    END IF;
END
$$;

ALTER FUNCTION public.update_post(msg TEXT, _id INTEGER) OWNER TO zotov;

CREATE FUNCTION public.update_post_quantity() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE forum
    SET posts = posts + 1
    WHERE slug = NEW.forum;

    INSERT INTO user_posts (author, forum)
    SELECT NEW.author, NEW.forum
    WHERE NOT EXISTS(
        SELECT 1
        FROM user_posts
        WHERE author = NEW.author AND forum = NEW.forum
    );

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.update_post_quantity() OWNER TO zotov;

CREATE FUNCTION public.update_thread_quantity() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE forum
    SET threads = threads + 1
    WHERE slug = NEW.forum;

    INSERT INTO user_posts (author, forum)
    SELECT NEW.author, NEW.forum
    WHERE NOT EXISTS(
        SELECT 1
        FROM user_posts
        WHERE author = NEW.author AND forum = NEW.forum
    );

    RETURN NULL;
END;
$$;

ALTER FUNCTION public.update_thread_quantity() OWNER TO zotov;

CREATE FUNCTION public.update_thread_votes() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE thread
    SET votes = votes + NEW.voice
    WHERE tid = NEW.thread;
    RETURN NULL;
END;
$$;

ALTER FUNCTION public.update_thread_votes() OWNER TO zotov;

CREATE FUNCTION public.update_thread_votes2() RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE thread
    SET votes = votes + 2 * New.voice
    WHERE tid = NEW.thread;
    RETURN NULL;
END;
$$;

ALTER FUNCTION public.update_thread_votes2() OWNER TO zotov;

CREATE FUNCTION public.update_vote(_author TEXT, _thread INTEGER, _voice INTEGER) RETURNS INTEGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _id        INTEGER;
    _old_voice INTEGER;
BEGIN
    SELECT voice, vid INTO _old_voice, _id FROM public.vote WHERE author = _author AND thread = _thread;
    IF FOUND THEN
        IF _old_voice = _voice THEN
            RETURN 0;
        ELSE
            UPDATE public.vote SET voice = _voice WHERE vid = _id;
            RETURN 2 * _voice;
        END IF;
    ELSE
        INSERT INTO public.vote(author, thread, voice)
        VALUES (_author, _thread, _voice);
        RETURN _voice;
    END IF;
END;
$$;

ALTER FUNCTION public.update_vote(_author TEXT, _thread INTEGER, _voice INTEGER) OWNER TO zotov;

SET default_tablespace = '';

SET default_with_oids = false;

CREATE TABLE public.users
(
    about    TEXT          NOT NULL,
    email    public.CITEXT NOT NULL UNIQUE,
    fullname TEXT          NOT NULL,
    nickname public.CITEXT NOT NULL UNIQUE
);


ALTER TABLE public.users OWNER TO zotov;

CREATE TABLE public.forum
(
    author  public.CITEXT NOT NULL REFERENCES public.users (nickname),
    slug    public.CITEXT NOT NULL PRIMARY KEY UNIQUE,
    threads INTEGER DEFAULT 0,
    title   TEXT          NOT NULL,
    posts   INTEGER DEFAULT 0
);

ALTER TABLE public.forum OWNER TO zotov;

CREATE TABLE public.thread
(
    tid     SERIAL        NOT NULL PRIMARY KEY,
    forum   public.CITEXT NOT NULL REFERENCES public.forum (slug),
    author  public.CITEXT NOT NULL REFERENCES public.users (nickname),
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    slug    public.CITEXT UNIQUE,
    message TEXT          NOT NULL,
    title   TEXT          NOT NULL,
    votes   INTEGER                  DEFAULT 0
);

ALTER TABLE public.thread OWNER TO zotov;

CREATE SEQUENCE public.tid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.tid OWNER TO zotov;

ALTER SEQUENCE public.tid OWNED BY public.thread.tid;

CREATE TABLE public.post
(
    pid       SERIAL        NOT NULL PRIMARY KEY,
    root      INTEGER       NOT NULL   DEFAULT 0,
    forum     public.CITEXT NOT NULL REFERENCES public.forum (slug),
    author    public.CITEXT NOT NULL REFERENCES public.users (nickname),
    thread    INTEGER       NOT NULL REFERENCES public.thread (tid),
    parent_id INTEGER REFERENCES public.post (pid),
    is_edited BOOLEAN                  DEFAULT false,
    message   TEXT          NOT NULL,
    created   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    path      INTEGER[]                DEFAULT '{}'::INTEGER[]
);

ALTER TABLE public.post OWNER TO zotov;

CREATE SEQUENCE public.pid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.pid OWNER TO zotov;

ALTER SEQUENCE public.pid OWNED BY public.post.pid;

CREATE FUNCTION public.new_post() RETURNS trigger AS
$$
BEGIN
    NEW.path = NEW.path || (SELECT currval('pid'))::INTEGER;
    NEW.root = NEW.path[1];
    RETURN NEW;
END;
$$
    LANGUAGE plpgsql;


CREATE TRIGGER new_post
    BEFORE INSERT
    ON public.post
    FOR EACH ROW
EXECUTE PROCEDURE public.new_post();

CREATE TABLE public.user_posts
(
    forum  public.CITEXT NOT NULL REFERENCES public.forum (slug),
    author public.CITEXT NOT NULL REFERENCES public.users (nickname)
);

ALTER TABLE public.user_posts OWNER TO zotov;

CREATE TABLE public.vote
(
    vid    SERIAL        NOT NULL PRIMARY KEY,
    author public.CITEXT NOT NULL REFERENCES public.users (nickname),
    thread INTEGER       NOT NULL REFERENCES public.thread (tid),
    voice  INTEGER       NOT NULL
);

ALTER TABLE public.vote OWNER TO zotov;

CREATE SEQUENCE public.vid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE public.vid OWNER TO zotov;

ALTER SEQUENCE public.vid OWNED BY public.vote.vid;

ALTER TABLE ONLY public.thread
    ALTER COLUMN tid SET DEFAULT nextval('public.tid'::regclass);
ALTER TABLE ONLY public.vote
    ALTER COLUMN vid SET DEFAULT nextval('public.vid'::regclass);
ALTER TABLE ONLY public.post
    ALTER COLUMN pid SET DEFAULT nextval('public.pid'::regclass);

CREATE INDEX index_on_root_posts_path ON public.post USING btree (root, path);

CREATE INDEX index_on_posts_thread_id ON public.post USING btree (thread, pid);

CREATE UNIQUE INDEX index_on_threads_slug ON public.thread USING btree (slug);

CREATE UNIQUE INDEX index_on_user_posts ON public.user_posts USING btree (author, forum);

CREATE INDEX index_on_user_posts_forum ON public.user_posts USING btree (forum);

CREATE UNIQUE INDEX index_on_users_nickname_c ON public.users USING btree (nickname COLLATE "C");

CREATE TRIGGER before_insert
    BEFORE INSERT
    ON public.post
    FOR EACH ROW
EXECUTE PROCEDURE public.check_post_parent();

CREATE TRIGGER insert_vote
    AFTER INSERT
    ON public.vote
    FOR EACH ROW
EXECUTE PROCEDURE public.update_thread_votes();

CREATE TRIGGER update_forum_post
    AFTER INSERT
    ON public.post
    FOR EACH ROW
EXECUTE PROCEDURE public.update_post_quantity();

CREATE TRIGGER update_forum_thread
    AFTER INSERT
    ON public.thread
    FOR EACH ROW
EXECUTE PROCEDURE public.update_thread_quantity();

CREATE TRIGGER update_vote
    AFTER UPDATE
    ON public.vote
    FOR EACH ROW
EXECUTE PROCEDURE public.update_thread_votes2();

CREATE INDEX index_on_threads_forum_created ON public.thread (forum, created);
