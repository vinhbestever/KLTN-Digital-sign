--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: signed_files; Type: TABLE; Schema: public; Owner: vinhbestever
--

CREATE TABLE public.signed_files (
    id integer NOT NULL,
    user_id integer,
    file_name text NOT NULL,
    signed_file bytea NOT NULL,
    signed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.signed_files OWNER TO vinhbestever;

--
-- Name: signed_files_id_seq; Type: SEQUENCE; Schema: public; Owner: vinhbestever
--

CREATE SEQUENCE public.signed_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.signed_files_id_seq OWNER TO vinhbestever;

--
-- Name: signed_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vinhbestever
--

ALTER SEQUENCE public.signed_files_id_seq OWNED BY public.signed_files.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: vinhbestever
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_verified boolean DEFAULT false,
    otp_code character varying(6),
    otp_expiration timestamp without time zone,
    private_key bytea,
    public_key text,
    avatar bytea,
    name character varying(255),
    phone character varying(20),
    address text,
    gender character varying(10),
    dob date,
    role character varying(10) DEFAULT 'user'::character varying,
    algorithm character varying(10) DEFAULT 'ECC'::character varying NOT NULL,
    cert_expires_at timestamp without time zone DEFAULT (now() + '7 days'::interval),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO vinhbestever;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: vinhbestever
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO vinhbestever;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vinhbestever
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: signed_files id; Type: DEFAULT; Schema: public; Owner: vinhbestever
--

ALTER TABLE ONLY public.signed_files ALTER COLUMN id SET DEFAULT nextval('public.signed_files_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: vinhbestever
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: signed_files signed_files_pkey; Type: CONSTRAINT; Schema: public; Owner: vinhbestever
--

ALTER TABLE ONLY public.signed_files
    ADD CONSTRAINT signed_files_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: vinhbestever
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vinhbestever
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: signed_files signed_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vinhbestever
--

ALTER TABLE ONLY public.signed_files
    ADD CONSTRAINT signed_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

