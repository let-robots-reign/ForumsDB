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

CREATE SCHEMA IF NOT EXISTS public;

CREATE EXTENSION IF NOT EXISTS CITEXT;

CREATE FUNCTION check_post_parent() RETURNS trigger
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

ALTER FUNCTION check_post_parent() OWNER TO zotov;

CREATE FUNCTION get_post_full(_id INTEGER)
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
        FROM post p,
             users u,
             thread t,
             forum f
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

ALTER FUNCTION get_post_full(_id INTEGER) OWNER TO zotov;

CREATE FUNCTION update_post(msg TEXT, _id INTEGER)
    RETURNS TABLE
            (
                author    CITEXT,
                created   TIMESTAMP WITH TIME ZONE,
                forum     CITEXT,
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
            SET message   = msg,
                is_edited = true
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

ALTER FUNCTION update_post(msg TEXT, _id INTEGER) OWNER TO zotov;

CREATE FUNCTION update_post_quantity() RETURNS trigger
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

ALTER FUNCTION update_post_quantity() OWNER TO zotov;

CREATE FUNCTION update_thread_quantity() RETURNS trigger
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

ALTER FUNCTION update_thread_quantity() OWNER TO zotov;

CREATE FUNCTION update_thread_votes() RETURNS trigger
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

ALTER FUNCTION update_thread_votes() OWNER TO zotov;

CREATE FUNCTION update_thread_votes2() RETURNS trigger
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

ALTER FUNCTION update_thread_votes2() OWNER TO zotov;

CREATE FUNCTION update_vote(_author TEXT, _thread INTEGER, _voice INTEGER) RETURNS INTEGER
    LANGUAGE plpgsql
AS
$$
DECLARE
    _id        INTEGER;
    _old_voice INTEGER;
BEGIN
    SELECT voice, vid INTO _old_voice, _id FROM vote WHERE author = _author AND thread = _thread;
    IF FOUND THEN
        IF _old_voice = _voice THEN
            RETURN 0;
        ELSE
            UPDATE vote SET voice = _voice WHERE vid = _id;
            RETURN 2 * _voice;
        END IF;
    ELSE
        INSERT INTO vote(author, thread, voice)
        VALUES (_author, _thread, _voice);
        RETURN _voice;
    END IF;
END;
$$;

ALTER FUNCTION update_vote(_author TEXT, _thread INTEGER, _voice INTEGER) OWNER TO zotov;

SET default_tablespace = '';

SET default_with_oids = false;

CREATE TABLE users
(
    about    TEXT          NOT NULL,
    email    CITEXT NOT NULL UNIQUE,
    fullname TEXT          NOT NULL,
    nickname CITEXT NOT NULL UNIQUE
);

ALTER TABLE users OWNER TO zotov;

CREATE TABLE forum
(
    author  CITEXT NOT NULL REFERENCES users (nickname),
    slug    CITEXT NOT NULL PRIMARY KEY UNIQUE,
    threads INTEGER DEFAULT 0,
    title   TEXT          NOT NULL,
    posts   INTEGER DEFAULT 0
);

ALTER TABLE forum OWNER TO zotov;

CREATE TABLE thread
(
    tid     SERIAL        NOT NULL PRIMARY KEY,
    forum   CITEXT NOT NULL REFERENCES forum (slug),
    author  CITEXT NOT NULL REFERENCES users (nickname),
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    slug    CITEXT UNIQUE,
    message TEXT          NOT NULL,
    title   TEXT          NOT NULL,
    votes   INTEGER                  DEFAULT 0
);

ALTER TABLE thread OWNER TO zotov;

CREATE SEQUENCE tid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE tid OWNER TO zotov;

ALTER SEQUENCE tid OWNED BY thread.tid;

CREATE TABLE post
(
    pid       SERIAL        NOT NULL PRIMARY KEY,
    root      INTEGER       NOT NULL   DEFAULT 0,
    forum     CITEXT NOT NULL REFERENCES forum (slug),
    author    CITEXT NOT NULL REFERENCES users (nickname),
    thread    INTEGER       NOT NULL REFERENCES thread (tid),
    parent_id INTEGER REFERENCES post (pid),
    is_edited BOOLEAN                  DEFAULT false,
    message   TEXT          NOT NULL,
    created   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    path      INTEGER[]                DEFAULT '{}'::INTEGER[]
);

ALTER TABLE post OWNER TO zotov;

CREATE SEQUENCE pid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE pid OWNER TO zotov;

ALTER SEQUENCE pid OWNED BY post.pid;

CREATE FUNCTION new_post() RETURNS trigger AS
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
    ON post
    FOR EACH ROW
EXECUTE PROCEDURE new_post();

CREATE TABLE user_posts
(
    forum  CITEXT NOT NULL REFERENCES forum (slug),
    author CITEXT NOT NULL REFERENCES users (nickname)
);

ALTER TABLE user_posts OWNER TO zotov;

CREATE TABLE vote
(
    vid    SERIAL        NOT NULL PRIMARY KEY,
    author CITEXT NOT NULL REFERENCES users (nickname),
    thread INTEGER       NOT NULL REFERENCES thread (tid),
    voice  INTEGER       NOT NULL
);

ALTER TABLE vote OWNER TO zotov;

CREATE SEQUENCE vid
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE vid OWNER TO zotov;

ALTER SEQUENCE vid OWNED BY vote.vid;

ALTER TABLE ONLY thread
    ALTER COLUMN tid SET DEFAULT nextval('tid'::regclass);
ALTER TABLE ONLY vote
    ALTER COLUMN vid SET DEFAULT nextval('vid'::regclass);
ALTER TABLE ONLY post
    ALTER COLUMN pid SET DEFAULT nextval('pid'::regclass);

CREATE INDEX index_on_root_posts_path ON post USING btree (root, path);

CREATE INDEX index_on_posts_thread_id ON post USING btree (thread, pid);

CREATE UNIQUE INDEX index_on_threads_slug ON thread USING btree (slug);

CREATE UNIQUE INDEX index_on_user_posts ON user_posts USING btree (author, forum);

CREATE INDEX index_on_user_posts_forum ON user_posts USING btree (forum);

CREATE UNIQUE INDEX index_on_users_nickname_c ON users USING btree (nickname COLLATE "C");

CREATE TRIGGER before_insert
    BEFORE INSERT
    ON post
    FOR EACH ROW
EXECUTE PROCEDURE check_post_parent();

CREATE TRIGGER insert_vote
    AFTER INSERT
    ON vote
    FOR EACH ROW
EXECUTE PROCEDURE update_thread_votes();

CREATE TRIGGER update_forum_post
    AFTER INSERT
    ON post
    FOR EACH ROW
EXECUTE PROCEDURE update_post_quantity();

CREATE TRIGGER update_forum_thread
    AFTER INSERT
    ON thread
    FOR EACH ROW
EXECUTE PROCEDURE update_thread_quantity();

CREATE TRIGGER update_vote
    AFTER UPDATE
    ON vote
    FOR EACH ROW
EXECUTE PROCEDURE update_thread_votes2();

CREATE INDEX index_on_threads_forum_created ON thread (forum, created);
