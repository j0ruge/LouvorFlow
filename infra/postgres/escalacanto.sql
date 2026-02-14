--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: artistas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artistas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome text NOT NULL
);


ALTER TABLE public.artistas OWNER TO postgres;

--
-- Name: artistas_musicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artistas_musicas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    artista_id uuid NOT NULL,
    musica_id uuid NOT NULL,
    bpm integer,
    cifras text,
    lyrics text,
    link_versao text
);


ALTER TABLE public.artistas_musicas OWNER TO postgres;

--
-- Name: eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    data date NOT NULL,
    fk_tipo_evento uuid NOT NULL,
    descricao text NOT NULL
);


ALTER TABLE public.eventos OWNER TO postgres;

--
-- Name: eventos_musicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos_musicas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    evento_id uuid NOT NULL,
    musicas_id uuid NOT NULL
);


ALTER TABLE public.eventos_musicas OWNER TO postgres;

--
-- Name: eventos_musicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos_musicos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    evento_id uuid NOT NULL,
    musico_id uuid NOT NULL
);


ALTER TABLE public.eventos_musicos OWNER TO postgres;

--
-- Name: funcoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funcoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome text NOT NULL
);


ALTER TABLE public.funcoes OWNER TO postgres;

--
-- Name: musicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.musicas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome text NOT NULL,
    fk_tonalidade uuid NOT NULL
);


ALTER TABLE public.musicas OWNER TO postgres;

--
-- Name: musicas_funcoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.musicas_funcoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    musica_id uuid NOT NULL,
    funcao_id uuid NOT NULL
);


ALTER TABLE public.musicas_funcoes OWNER TO postgres;

--
-- Name: musicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.musicos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome text NOT NULL,
    doc_id text NOT NULL
);


ALTER TABLE public.musicos OWNER TO postgres;

--
-- Name: musicos_funcoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.musicos_funcoes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    musico_id uuid NOT NULL,
    funcao_id uuid NOT NULL
);


ALTER TABLE public.musicos_funcoes OWNER TO postgres;

--
-- Name: tipos_eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_eventos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome text NOT NULL
);


ALTER TABLE public.tipos_eventos OWNER TO postgres;

--
-- Name: tonalidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tonalidades (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tom text NOT NULL
);


ALTER TABLE public.tonalidades OWNER TO postgres;

--
-- Data for Name: artistas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artistas (id, nome) FROM stdin;
64c143be-329f-44e9-a8c2-5b0616cb029d	Aline Barros
b867f984-3c13-4a8a-8eae-ec38871d20d6	Fernanda Brum
3c14c1f4-ece3-46b3-86b8-d819d5955222	Morada
c70af4e5-2389-4e4e-ad94-a1f12c8cfab2	DROPS
c6f4428c-5260-4af4-8ddd-2740243af04e	Ana N¢brega
2e3308bc-4a72-416b-8d58-029a03993fad	Gabriel Guedes
26bb9471-31bc-4973-8b47-5f8263d0e7d3	Diante do Trono
59e18455-7356-4449-92df-771d67c157d0	Oficine G3
70a97ee3-8a9d-4010-80bc-9bf8fc880622	Marquinhos Gomes
750be637-8386-48b1-b209-70dfeb6f0092	Gabriela Rocha
e64d108b-1fc1-4a3b-9b32-95396de32c53	µlvaro Tito
1c7557d4-7828-4dd6-9f8b-8a8fa1a01a89	S‚rgio Lopes
069a877b-05b9-4b0f-829c-a5c517843881	Eyshila
4b6557b9-aa57-4f31-b3ee-aa7121599ab9	Mauro Henrique
9e3a86bf-24ef-4b83-a3c7-a6455383adf5	Paulo Cesar Baruk
fa05d41d-7388-4a1b-9e4c-d34d4b27d9bb	IBAB
\.


--
-- Data for Name: artistas_musicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artistas_musicas (id, artista_id, musica_id, bpm, cifras, lyrics, link_versao) FROM stdin;
\.


--
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos (id, data, fk_tipo_evento, descricao) FROM stdin;
182c80b5-c822-4e36-aeca-2eb8a698d978	2025-04-05	43268690-7cc8-432c-b002-630bbe254d76	Culto realizado pelos jovens
e257f02f-a6e0-4257-8dc8-e83a746d39fb	2025-04-06	4a2e95c6-7687-4f0a-9d32-71c9d82cdc14	Ensaio das m£sicas para a Santa Ceia
\.


--
-- Data for Name: eventos_musicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos_musicas (id, evento_id, musicas_id) FROM stdin;
11b4bb53-e7df-4602-b09d-204bed13b319	182c80b5-c822-4e36-aeca-2eb8a698d978	9394e3b7-2860-40e1-b983-80b86371a752
e3772f26-b430-4b7d-a674-0f3a6b696565	182c80b5-c822-4e36-aeca-2eb8a698d978	270c404f-5525-4100-9a8c-40381a851b0f
c714104e-9ba9-4dcc-828a-dad31f54cb90	e257f02f-a6e0-4257-8dc8-e83a746d39fb	9da8fd1c-6f1e-4e36-b6e7-3ccaf70a456b
\.


--
-- Data for Name: eventos_musicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos_musicos (id, evento_id, musico_id) FROM stdin;
\.


--
-- Data for Name: funcoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.funcoes (id, nome) FROM stdin;
97f20870-0e66-4653-96b6-d3f1e42f1545	Vacalista
3a838fd7-67fd-46ff-95ae-cd1107a4f661	Guitarrista
4d8b4b7a-dd61-4e5c-8a0b-789af62ac0f7	Baterista
521bce94-df55-44d0-a7c9-2e5eaa909a93	Tecladista
45f97730-4d50-4717-b7db-e8c3d2052754	Baixista
6219ffb9-85c9-44fb-914b-546e9edaae69	Violonista
4d8731b2-6ba8-4e23-b55e-3237d858c5b2	Operador de Som
042df3d6-99cc-488d-9757-821baf9fd850	Saxofonista
b0be2c21-b92b-43e3-9506-06fa2b00ba88	Violinista
\.


--
-- Data for Name: musicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.musicas (id, nome, fk_tonalidade) FROM stdin;
9394e3b7-2860-40e1-b983-80b86371a752	Sonda-me, Usa-me	3852139e-4c5f-40e6-8c2f-5942e5ac1c1f
270c404f-5525-4100-9a8c-40381a851b0f	Te Adorar, Senhor	1f8b12db-f175-4149-acf9-12f3ec8c5a60
9da8fd1c-6f1e-4e36-b6e7-3ccaf70a456b	Tu Es Fiel	95b30bd5-a311-4568-958d-f1ca31a2c1ad
\.


--
-- Data for Name: musicas_funcoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.musicas_funcoes (id, musica_id, funcao_id) FROM stdin;
\.


--
-- Data for Name: musicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.musicos (id, nome, doc_id) FROM stdin;
856ce88e-4e4a-4472-9073-ec362b82dfa9	Vanessa Ferrari	12345678901
50b74fd9-7ae6-41ca-bbd8-4e930c82d174	Daniele Lopes	12345678902
220c745f-fde4-476b-a785-2c45414e8ac9	Jorge Ferrari	12345678903
b61b12b4-7c51-4f75-8535-8003e721bc22	Juliana	12345678904
ff4ace5c-537e-49e9-80ef-8840d515e8f8	Robert Ferrari	12345678905
31dc8ccc-e860-4b60-9528-f7ac0f6a7929	Kariny Ferrari	12345678906
21d2179b-0ad2-4416-816a-f33dc6942ee6	Gabriel P¢voa	12345678907
73f93de9-8c52-4681-aeaa-06290c649e61	Tiago	12345678908
2ced78fb-4b8c-4512-b745-46029f5cd14e	Andressa	12345678909
acb4909a-f3f2-4fd9-bee5-5a61f470573d	Sonia	12345678910
17e2ce1b-d3a5-41f1-b2c1-c97ccf7b8e5d	Beatriz	12345678911
24032fcb-ddc7-4e31-9a7d-4feb515d51bc	Bill	12345678912
\.


--
-- Data for Name: musicos_funcoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.musicos_funcoes (id, musico_id, funcao_id) FROM stdin;
\.


--
-- Data for Name: tipos_eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_eventos (id, nome) FROM stdin;
43268690-7cc8-432c-b002-630bbe254d76	Culto Jovem
4a2e95c6-7687-4f0a-9d32-71c9d82cdc14	Santa Ceia
\.


--
-- Data for Name: tonalidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tonalidades (id, tom) FROM stdin;
85e7d27c-c18b-49d8-a529-3ef82310b5dc	A
ffe957fa-d6db-45ed-ac05-f040f6be5caa	A#
4ab34a6e-eb58-41c1-b00f-7a1fe0e807d1	B
3852139e-4c5f-40e6-8c2f-5942e5ac1c1f	C
a7fa253e-da2a-4cc0-8247-7c56f1826db7	C#
e2842836-c95e-49ef-8c93-82e911f34925	D
2e154cf1-1d4b-4d13-9b2a-a769bf5cca6e	D#
1f8b12db-f175-4149-acf9-12f3ec8c5a60	E
3a7ef5e5-54f1-437d-b98c-429c9f32b8bf	F
e7f23858-4272-4aa4-8442-8093abfe4fd0	F#
95b30bd5-a311-4568-958d-f1ca31a2c1ad	G
4b063fdc-9289-43ab-a19c-45e8e5204768	G#
2d43b8c6-332f-40ca-b34a-8cb5b51a01cf	Ab
06327fd5-1e8b-4ed3-802e-00c97e487bde	Bb
6f09dc45-ba68-4756-8c97-99f3ba7ecf83	Db
883a19b3-ae26-48ab-9446-2c3ec571104f	Eb
77051237-edd4-4a11-8683-dbf151a6615e	Gb
\.


--
-- Name: artistas_musicas artistas_musicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artistas_musicas
    ADD CONSTRAINT artistas_musicas_pkey PRIMARY KEY (id);


--
-- Name: artistas artistas_nome_unico; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artistas
    ADD CONSTRAINT artistas_nome_unico UNIQUE (nome);


--
-- Name: artistas artistas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artistas
    ADD CONSTRAINT artistas_pkey PRIMARY KEY (id);


--
-- Name: eventos_musicas eventos_musicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_musicas
    ADD CONSTRAINT eventos_musicas_pkey PRIMARY KEY (id);


--
-- Name: eventos_musicos eventos_musicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_musicos
    ADD CONSTRAINT eventos_musicos_pkey PRIMARY KEY (id);


--
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- Name: funcoes funcoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funcoes
    ADD CONSTRAINT funcoes_pkey PRIMARY KEY (id);


--
-- Name: musicas_funcoes musicas_funcoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicas_funcoes
    ADD CONSTRAINT musicas_funcoes_pkey PRIMARY KEY (id);


--
-- Name: musicas musicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicas
    ADD CONSTRAINT musicas_pkey PRIMARY KEY (id);


--
-- Name: musicos musicos_doc_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicos
    ADD CONSTRAINT musicos_doc_id_key UNIQUE (doc_id);


--
-- Name: musicos_funcoes musicos_funcoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicos_funcoes
    ADD CONSTRAINT musicos_funcoes_pkey PRIMARY KEY (id);


--
-- Name: musicos musicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicos
    ADD CONSTRAINT musicos_pkey PRIMARY KEY (id);


--
-- Name: tipos_eventos tipos_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_eventos
    ADD CONSTRAINT tipos_eventos_pkey PRIMARY KEY (id);


--
-- Name: tonalidades tonalidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tonalidades
    ADD CONSTRAINT tonalidades_pkey PRIMARY KEY (id);


--
-- Name: artistas_musicas artistas_musicas_artista_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artistas_musicas
    ADD CONSTRAINT artistas_musicas_artista_id_fkey FOREIGN KEY (artista_id) REFERENCES public.artistas(id) ON DELETE CASCADE;


--
-- Name: artistas_musicas artistas_musicas_musica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artistas_musicas
    ADD CONSTRAINT artistas_musicas_musica_id_fkey FOREIGN KEY (musica_id) REFERENCES public.musicas(id) ON DELETE CASCADE;


--
-- Name: eventos eventos_fk_tipo_evento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_fk_tipo_evento_fkey FOREIGN KEY (fk_tipo_evento) REFERENCES public.tipos_eventos(id) ON DELETE CASCADE;


--
-- Name: eventos_musicas eventos_musicas_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_musicas
    ADD CONSTRAINT eventos_musicas_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: eventos_musicas eventos_musicas_musicas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_musicas
    ADD CONSTRAINT eventos_musicas_musicas_id_fkey FOREIGN KEY (musicas_id) REFERENCES public.musicas(id) ON DELETE CASCADE;


--
-- Name: eventos_musicos eventos_musicos_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_musicos
    ADD CONSTRAINT eventos_musicos_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.eventos(id) ON DELETE CASCADE;


--
-- Name: eventos_musicos eventos_musicos_musico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos_musicos
    ADD CONSTRAINT eventos_musicos_musico_id_fkey FOREIGN KEY (musico_id) REFERENCES public.musicos(id) ON DELETE CASCADE;


--
-- Name: musicas musicas_fk_tonalidade_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicas
    ADD CONSTRAINT musicas_fk_tonalidade_fkey FOREIGN KEY (fk_tonalidade) REFERENCES public.tonalidades(id) ON DELETE CASCADE;


--
-- Name: musicas_funcoes musicas_funcoes_funcao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicas_funcoes
    ADD CONSTRAINT musicas_funcoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE CASCADE;


--
-- Name: musicas_funcoes musicas_funcoes_musica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicas_funcoes
    ADD CONSTRAINT musicas_funcoes_musica_id_fkey FOREIGN KEY (musica_id) REFERENCES public.musicas(id) ON DELETE CASCADE;


--
-- Name: musicos_funcoes musicos_funcoes_funcao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicos_funcoes
    ADD CONSTRAINT musicos_funcoes_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES public.funcoes(id) ON DELETE CASCADE;


--
-- Name: musicos_funcoes musicos_funcoes_musico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musicos_funcoes
    ADD CONSTRAINT musicos_funcoes_musico_id_fkey FOREIGN KEY (musico_id) REFERENCES public.musicos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

