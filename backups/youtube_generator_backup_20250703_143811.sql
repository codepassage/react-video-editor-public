--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

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

--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MediaType" AS ENUM (
    'image',
    'video',
    'audio',
    'unknown'
);


ALTER TYPE public."MediaType" OWNER TO postgres;

--
-- Name: RenderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RenderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."RenderStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AudioMapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AudioMapping" (
    id text NOT NULL,
    "scriptId" text NOT NULL,
    "audioPath" text NOT NULL,
    "ttsConfig" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AudioMapping" OWNER TO postgres;

--
-- Name: Bundle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bundle" (
    id text NOT NULL,
    name text NOT NULL,
    color text NOT NULL,
    "templateId" text NOT NULL,
    "startTime" double precision NOT NULL,
    "endTime" double precision NOT NULL,
    "baseClipIds" jsonb NOT NULL,
    "templateGroupIds" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Bundle" OWNER TO postgres;

--
-- Name: CsvColumnMap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CsvColumnMap" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "resourceTemplateId" text,
    "columnCount" integer DEFAULT 0 NOT NULL,
    "mappingComplexity" text DEFAULT 'simple'::text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CsvColumnMap" OWNER TO postgres;

--
-- Name: CsvColumnMapVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CsvColumnMapVersion" (
    id text NOT NULL,
    "csvMapId" text NOT NULL,
    "mappingData" jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "versionString" text DEFAULT '1.0.0'::text NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CsvColumnMapVersion" OWNER TO postgres;

--
-- Name: MediaFile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MediaFile" (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    mimetype text NOT NULL,
    size integer NOT NULL,
    "mediaType" public."MediaType" NOT NULL,
    url text NOT NULL,
    "thumbnailUrl" text,
    width integer,
    height integer,
    duration double precision,
    metadata jsonb,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public."MediaFile" OWNER TO postgres;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "templateId" text,
    "userId" text,
    "projectData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- Name: RenderResult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RenderResult" (
    id text NOT NULL,
    filename text NOT NULL,
    "originalRequest" jsonb NOT NULL,
    status public."RenderStatus" DEFAULT 'PENDING'::public."RenderStatus" NOT NULL,
    progress double precision DEFAULT 0 NOT NULL,
    duration double precision,
    size integer,
    url text,
    "errorMessage" text,
    "templateId" text,
    "projectId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone
);


ALTER TABLE public."RenderResult" OWNER TO postgres;

--
-- Name: ResourceData; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceData" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "itemCount" integer DEFAULT 0 NOT NULL,
    "hasNested" boolean DEFAULT false NOT NULL,
    "maxDepth" integer DEFAULT 0 NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "csvMapId" text,
    "resourceTemplateId" text
);


ALTER TABLE public."ResourceData" OWNER TO postgres;

--
-- Name: ResourceDataVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceDataVersion" (
    id text NOT NULL,
    "resourceDataId" text NOT NULL,
    data jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "versionString" text DEFAULT '1.0.0'::text NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ResourceDataVersion" OWNER TO postgres;

--
-- Name: ResourceTemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "itemCount" integer DEFAULT 0 NOT NULL,
    "hasNested" boolean DEFAULT false NOT NULL,
    "maxDepth" integer DEFAULT 0 NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ResourceTemplate" OWNER TO postgres;

--
-- Name: ResourceTemplateVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceTemplateVersion" (
    id text NOT NULL,
    "resourceTemplateId" text NOT NULL,
    "templateData" jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "versionString" text DEFAULT '1.0.0'::text NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ResourceTemplateVersion" OWNER TO postgres;

--
-- Name: Script; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Script" (
    id text NOT NULL,
    content text NOT NULL,
    language text DEFAULT 'ko'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Script" OWNER TO postgres;

--
-- Name: Template; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Template" (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "totalClips" integer DEFAULT 0 NOT NULL,
    "totalTracks" integer DEFAULT 0 NOT NULL,
    duration double precision DEFAULT 0 NOT NULL,
    "typeId" text NOT NULL,
    "screenshotPath" text
);


ALTER TABLE public."Template" OWNER TO postgres;

--
-- Name: TemplateGroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TemplateGroup" (
    id text NOT NULL,
    name text NOT NULL,
    "templateId" text NOT NULL,
    "clipIds" jsonb NOT NULL,
    "startTime" double precision NOT NULL,
    "endTime" double precision NOT NULL,
    "isProtected" boolean DEFAULT false NOT NULL,
    color text NOT NULL,
    "bundleId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TemplateGroup" OWNER TO postgres;

--
-- Name: TemplateType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TemplateType" (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TemplateType" OWNER TO postgres;

--
-- Name: TemplateVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TemplateVersion" (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "projectData" jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "versionString" text DEFAULT '1.0.0'::text NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."TemplateVersion" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: template_resource_compatibility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_resource_compatibility (
    id text NOT NULL,
    "templateId" text NOT NULL,
    "resourceId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.template_resource_compatibility OWNER TO postgres;

--
-- Data for Name: AudioMapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AudioMapping" (id, "scriptId", "audioPath", "ttsConfig", "createdAt") FROM stdin;
\.


--
-- Data for Name: Bundle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bundle" (id, name, color, "templateId", "startTime", "endTime", "baseClipIds", "templateGroupIds", "createdAt") FROM stdin;
\.


--
-- Data for Name: CsvColumnMap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CsvColumnMap" (id, name, description, "resourceTemplateId", "columnCount", "mappingComplexity", "userId", "createdAt", "updatedAt") FROM stdin;
010f2433-1f9c-4f22-b204-28d34254267d	Map for Sample outer 01		\N	0	simple	\N	2025-07-03 03:50:40.462	2025-07-03 03:50:40.462
\.


--
-- Data for Name: CsvColumnMapVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CsvColumnMapVersion" (id, "csvMapId", "mappingData", version, "versionString", "isLatest", "createdAt") FROM stdin;
5a130738-0057-4064-91fe-a099c3b2d036	010f2433-1f9c-4f22-b204-28d34254267d	{"data": "level 1,level 2,level 3,level 4,column\\r\\naudio-outer01,,,,title\\r\\n,template-inner-bundle:audio-01,,,trans category\\r\\n,template-inner-bundle:audio-04,,,source category\\r\\n,template-inner-bundle:bundle-inner-middle,,,\\r\\n,template-inner-bundle:bundle-inner-middle,bundle-inner-middle:audio-02,,trans item\\r\\n,template-inner-bundle:bundle-inner-middle,bundle-inner-middle:audio-03,,source item", "rows": [["audio-outer01", "", "", "", "title"], ["", "template-inner-bundle:audio-01", "", "", "trans category"], ["", "template-inner-bundle:audio-04", "", "", "source category"], ["", "template-inner-bundle:bundle-inner-middle", "", "", ""], ["", "template-inner-bundle:bundle-inner-middle", "bundle-inner-middle:audio-02", "", "trans item"], ["", "template-inner-bundle:bundle-inner-middle", "bundle-inner-middle:audio-03", "", "source item"]], "headers": ["level 1", "level 2", "level 3", "level 4", "column"], "mapping": {}}	1	1.0.0	t	2025-07-03 03:50:40.47
\.


--
-- Data for Name: MediaFile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MediaFile" (id, filename, "originalName", mimetype, size, "mediaType", url, "thumbnailUrl", width, height, duration, metadata, "uploadedAt", "deletedAt") FROM stdin;
83563d3d-b91d-4d33-b993-261020035c81	f63b7f33-100b-4008-9a98-b6d95745dbbf-0b01f5a31a88777c6a1d3e4641deea06.wav	0b01f5a31a88777c6a1d3e4641deea06.wav	audio/wav	34270	audio	/uploads/f63b7f33-100b-4008-9a98-b6d95745dbbf-0b01f5a31a88777c6a1d3e4641deea06.wav	\N	\N	\N	0.7761	{}	2025-06-30 03:00:29.291	\N
591a361e-eefa-4ba8-99a9-99b3806810c0	3704a0a1-b41f-4f21-b9a2-de33dbb78be5-60c6d7008bf7fbb5a9114dd57e239bfb.wav	60c6d7008bf7fbb5a9114dd57e239bfb.wav	audio/wav	56752	audio	/uploads/3704a0a1-b41f-4f21-b9a2-de33dbb78be5-60c6d7008bf7fbb5a9114dd57e239bfb.wav	\N	\N	\N	1.285896	{}	2025-06-30 03:00:29.291	\N
61349adf-7e3c-42d1-abfe-9ee228da5c24	c0a0e96a-8938-477c-a2a3-2eb53cdf3a95-9c557d1363581616227b31e672046c7c.wav	9c557d1363581616227b31e672046c7c.wav	audio/wav	79176	audio	/uploads/c0a0e96a-8938-477c-a2a3-2eb53cdf3a95-9c557d1363581616227b31e672046c7c.wav	\N	\N	\N	1.794376	{}	2025-06-30 03:00:29.292	\N
b5ba0b7b-9713-483f-9a20-8dd7ef95f026	345f33dc-7746-428c-9f54-c85ea7f596b9-f30d8179e850de469e33ef9ce788841d.wav	f30d8179e850de469e33ef9ce788841d.wav	audio/wav	76656	audio	/uploads/345f33dc-7746-428c-9f54-c85ea7f596b9-f30d8179e850de469e33ef9ce788841d.wav	\N	\N	\N	1.737234	{}	2025-06-30 03:00:29.291	\N
cd236991-01e9-4c59-8ba7-7591eb79d57e	b1a9067d-08c4-4387-8069-14e41b20b993-fc0e68aab0c0e1f2240542a30bfb645c.wav	fc0e68aab0c0e1f2240542a30bfb645c.wav	audio/wav	32504	audio	/uploads/b1a9067d-08c4-4387-8069-14e41b20b993-fc0e68aab0c0e1f2240542a30bfb645c.wav	\N	\N	\N	0.736054	{}	2025-06-30 03:00:29.291	\N
7c0ea2fe-f1c2-4939-be4f-b32624136d5e	22886b68-f5fb-4d5d-90b4-63a17390114f-bf2f4f9fe2a7c1d9b49d07a604f0382b.wav	bf2f4f9fe2a7c1d9b49d07a604f0382b.wav	audio/wav	44342	audio	/uploads/22886b68-f5fb-4d5d-90b4-63a17390114f-bf2f4f9fe2a7c1d9b49d07a604f0382b.wav	\N	\N	\N	1.00449	{}	2025-06-30 03:00:29.291	\N
a1f8976b-0db3-41b6-94a4-b35b51d7a86a	0220e625-2198-4919-8f90-14f506b14d30-3104c9311a79161a3f6684b473997694.wav	3104c9311a79161a3f6684b473997694.wav	audio/wav	63872	audio	/uploads/0220e625-2198-4919-8f90-14f506b14d30-3104c9311a79161a3f6684b473997694.wav	\N	\N	\N	1.447347	{}	2025-06-30 03:00:29.292	\N
e09a4678-e470-4a6c-a613-0032553adb67	76d201f7-39fd-4369-b04c-ce8ec18fff36-7117ca7f7850e1ef0ec77b09e1948607.wav	7117ca7f7850e1ef0ec77b09e1948607.wav	audio/wav	66990	audio	/uploads/76d201f7-39fd-4369-b04c-ce8ec18fff36-7117ca7f7850e1ef0ec77b09e1948607.wav	\N	\N	\N	1.51805	{}	2025-06-30 03:00:29.292	\N
7d49012c-87cd-4a5e-bad2-09de09995374	14855582-4386-4059-8a22-672dc32fb993-Screenshot 2025-03-20 at 9.20.41 AM.png	Screenshot 2025-03-20 at 9.20.41 AM.png	image/png	0	image	/uploads/14855582-4386-4059-8a22-672dc32fb993-Screenshot 2025-03-20 at 9.20.41 AM.png	\N	848	783	\N	{}	2025-07-02 14:07:47.462	\N
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, name, description, "templateId", "userId", "projectData", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RenderResult; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RenderResult" (id, filename, "originalRequest", status, progress, duration, size, url, "errorMessage", "templateId", "projectId", "createdAt", "completedAt") FROM stdin;
\.


--
-- Data for Name: ResourceData; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResourceData" (id, name, description, "itemCount", "hasNested", "maxDepth", "userId", "createdAt", "updatedAt", "csvMapId", "resourceTemplateId") FROM stdin;
acaf4d80-48be-433b-85d8-24f4b50a71c2	중앙 번들 기본	resource-data01.json	3	f	1	\N	2025-06-29 23:45:59.109	2025-06-29 23:45:59.109	\N	\N
da52124a-43d9-4aa0-830f-4f08316a7bb1	resource-data01-1.json	sample template two bundles	5	f	1	\N	2025-06-30 03:26:04.732	2025-06-30 03:26:04.732	\N	\N
5bf8713b-0085-4adb-afde-713a96e542d5	resource-data02.json	very simple outer 01	3	f	1	\N	2025-06-30 04:51:09.554	2025-06-30 04:51:09.554	\N	\N
6b323dd9-0d5d-4a61-8585-34eff556526b	resource-data03.json		2	t	2	\N	2025-06-30 01:57:23.979	2025-06-30 17:30:33.846	\N	\N
\.


--
-- Data for Name: ResourceDataVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResourceDataVersion" (id, "resourceDataId", data, version, "versionString", "isLatest", "createdAt") FROM stdin;
67970dee-0227-4745-be30-594e49c6c29c	acaf4d80-48be-433b-85d8-24f4b50a71c2	{"items": [{"data": {"text": "클립의 예제 문장 1입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 2-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-1.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 2-2입니다.", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-2.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 2-3입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-3.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 4입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}	1	1.0.0	t	2025-06-29 23:45:59.113
596755d3-b4b0-4e50-9d63-cb47246f9950	da52124a-43d9-4aa0-830f-4f08316a7bb1	{"items": [{"data": {"text": "클립의 예제 문장 audio-01입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 audio-01-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-1.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-02-2입니다.", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-2.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-02-3입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-3.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 audio-04입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-07"]}, {"name": "bundle-inner-right", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 audio-05-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-05", "subordinateItems": ["sentence-05"]}, {"data": {"text": "This is the example sentence audio-06-1.", "type": "text", "language": "en"}, "name": "audio-06", "subordinateItems": ["sentence-06"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-05-2입니다. ", "type": "text", "language": "ko"}, "name": "audio-05", "subordinateItems": ["sentence-05"]}, {"data": {"text": "This is the example sentence audio-06-2.", "type": "text", "language": "en"}, "name": "audio-06", "subordinateItems": ["sentence-06"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 audio-07입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-07", "subordinateItems": ["sentence-07"]}]}	1	1.0.0	t	2025-06-30 03:26:04.735
288d27e0-a914-45a4-8dc6-f49ee20d0227	5bf8713b-0085-4adb-afde-713a96e542d5	{"items": [{"data": {"text": "클립의 예제 문장 audio-01입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "template-inner-middle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 audio-01-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"data": {"text": "This is the example sentence audio-02-1.", "type": "text", "language": "en"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-01-2입니다.", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-02-2.", "type": "text", "language": "en"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-01-3입니다. ", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"data": {"text": "This is the example sentence audio-02-3.", "type": "text", "language": "en"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 audio-04입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}	1	1.0.0	t	2025-06-30 04:51:09.556
a4ba54f0-9f28-4b1c-975b-744b02a1249b	6b323dd9-0d5d-4a61-8585-34eff556526b	{"items": [{"data": {"text": "audio-outer01의 예제 문장 1입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-outer01", "subordinateItems": ["sentence-01"]}, {"name": "template-inner-bundle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 1입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 2-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-1.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 2-2입니다.", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-2.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 2-3입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-3.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 4입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}, {"items": [{"data": {"text": "탬플릿 예제 문장 2-1입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "탬플릿안 번들의 예제 문장 2-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence in Bundel 2-1.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "탬플릿안 번들의 예제 문장 2-2입니다.", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence in Bundel 3-2.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 2-3입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence 3-3.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 4-2입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}], "isIterator": true}]}	1	1.0.0	f	2025-06-30 01:57:23.982
bcdc546e-e23d-48fd-8897-42ac6d46a184	6b323dd9-0d5d-4a61-8585-34eff556526b	{"items": [{"data": {"text": "audio-outer01의 예제 문장입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-outer01", "subordinateItems": ["sentence-01"]}, {"name": "template-inner-bundle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 audio-01-1입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "클립의 예제 문장 audio-02-1입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-1.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-02-2입니다.", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-2.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-02-3입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-3.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 audio-04입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}, {"items": [{"data": {"text": "탬플릿 예제 문장 audio-01-2입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "탬플릿안 번들의 예제 문장 audio-02-2입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence in Bundel audio-03-2.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "탬플릿안 번들의 예제 문장 audio-02-3입니다.", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence in Bundel audio-03-3.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}, {"items": [{"data": {"text": "클립의 예제 문장 audio-02-4입니다. ", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "This is the example sentence audio-03-4.", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "클립의 예제 문장 audio-04-2입니다. 하하하", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}], "isIterator": true}]}	2	1.0.0	t	2025-06-30 17:30:33.848
\.


--
-- Data for Name: ResourceTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResourceTemplate" (id, name, description, "itemCount", "hasNested", "maxDepth", "userId", "createdAt", "updatedAt") FROM stdin;
f2028d95-bb11-4a2b-b463-0cd5f2cb9a25	Resource template for Sample outer 01		2	t	3	\N	2025-07-03 04:58:54.33	2025-07-03 04:58:54.33
\.


--
-- Data for Name: ResourceTemplateVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResourceTemplateVersion" (id, "resourceTemplateId", "templateData", version, "versionString", "isLatest", "createdAt") FROM stdin;
d115d3bc-23d3-4bc4-a41c-5b738d4bc5e5	f2028d95-bb11-4a2b-b463-0cd5f2cb9a25	{"items": [{"data": {"text": "", "type": "text", "language": "ko"}, "name": "audio-outer01", "subordinateItems": ["sentence-01"]}, {"name": "template-inner-bundle", "containers": [{"items": [{"data": {"text": "", "type": "text", "language": "ko"}, "name": "audio-01", "subordinateItems": ["sentence-01"]}, {"name": "bundle-inner-middle", "containers": [{"items": [{"data": {"text": "", "type": "text", "language": "ko"}, "name": "audio-02", "subordinateItems": ["sentence-02"]}, {"data": {"text": "", "type": "text", "language": "en"}, "name": "audio-03", "subordinateItems": ["sentence-03"]}]}], "isIterator": true}, {"data": {"text": "", "type": "text", "language": "ko"}, "name": "audio-04", "subordinateItems": ["sentence-04"]}]}], "isIterator": true}]}	1	1.0.0	t	2025-07-03 04:58:54.336
\.


--
-- Data for Name: Script; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Script" (id, content, language, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Template; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Template" (id, name, description, "userId", "createdAt", "updatedAt", "totalClips", "totalTracks", duration, "typeId", "screenshotPath") FROM stdin;
2a1e28a6-ad51-444a-aa06-46ab335398db	Sample outer 01		\N	2025-06-29 23:38:53.75	2025-06-29 23:38:53.75	12	5	60	00000000-0000-0000-0000-000000000002	/uploads/templates/template-1751240333743-936673672.png
8c7f6d00-ab37-4319-918d-1ecf9878c715	Sample Inner 01		\N	2025-06-29 23:40:56.882	2025-06-29 23:40:56.882	8	4	10	00000000-0000-0000-0000-000000000001	/uploads/templates/template-1751240456870-80351365.png
4eb1d97b-f02e-4d20-b329-cb2c8e40b630	sample template two bundles	번들 두개(middle, right)	\N	2025-06-30 03:12:31.99	2025-06-30 03:12:31.99	14	4	10	00000000-0000-0000-0000-000000000001	/uploads/templates/template-1751253151984-397393002.png
10e56183-20a9-491a-9696-b5fe17bac533	Very simple inner 01	두쌍클립	\N	2025-06-30 04:35:38.852	2025-06-30 04:36:48.76	4	4	4.5	00000000-0000-0000-0000-000000000001	/uploads/templates/template-1751258138846-60763289.png
6ffd527d-a1fb-487e-b988-e437c7dbbd7e	very simple outer 01	중간 심플 템프릿	\N	2025-06-30 04:44:16.46	2025-07-02 14:12:54.302	9	4	9	00000000-0000-0000-0000-000000000002	/uploads/templates/template-1751258656450-81709428.png
\.


--
-- Data for Name: TemplateGroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TemplateGroup" (id, name, "templateId", "clipIds", "startTime", "endTime", "isProtected", color, "bundleId", "createdAt") FROM stdin;
\.


--
-- Data for Name: TemplateType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TemplateType" (id, name, description, "createdAt") FROM stdin;
00000000-0000-0000-0000-000000000001	1 단계	첫 번째 단계 템플릿	2025-07-02 17:04:55.728
00000000-0000-0000-0000-000000000002	2 단계	두 번째 단계 템플릿	2025-07-02 17:04:55.728
\.


--
-- Data for Name: TemplateVersion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TemplateVersion" (id, "templateId", "projectData", version, "versionString", "isLatest", "createdAt") FROM stdin;
7f0ba407-232c-4898-bc98-9258a07f1421	2a1e28a6-ad51-444a-aa06-46ab335398db	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 480, "y": 50, "id": "1751156995138-r08ewrezo", "name": "sentence-outer01", "text": "이 문장은 Sentence 클립의 예제 문장입니다. before", "color": "#FFFFFF", "width": 960, "height": 120, "endTime": 4.100000000000001, "mediaId": "sentence-1750877678971", "opacity": 1, "trackId": "track-1", "duration": 1.547052, "fontSize": 57, "rotation": 0, "mediaType": "sentence", "startTime": 2.552948000000002, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 8, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"dynamicProperties": [{"sourceData": "text", "propertyName": "text"}], "endAnchorExtended": {"offset": 0, "anchorPoint": "start", "templateGroupId": "template-group-1751156995138-6c8yona3o"}, "startAnchorExtended": {"offset": 0.05294800000000155, "baseClipId": "1751156995138-6rjm90u4x", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751156995138-derwir7ul", "name": "sentence-01", "text": "클립의 예제 문장 1입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 5.778911999999999, "mediaId": "sentence-1750598755891", "opacity": 1, "trackId": "track-1", "duration": 1.678912, "fontSize": 80, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 4.100000000000001, "textAlign": "center", "fontFamily": "Nanum Barun Pen", "paddingTop": 14, "textShadow": "2px 2px 4px rgba(0,0,0,0.8)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 6, "backgroundColor": "linear-gradient(45deg, #667eea, #764ba2)", "templateGroupId": "template-group-1751156995138-6c8yona3o", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchorExtended": {"offset": 0.3099999999999987, "baseClipId": "1751156995138-lb96u676f", "anchorPoint": "end"}, "startAnchorExtended": {"offset": -0.25, "baseClipId": "1751156995138-lb96u676f", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751156995138-gdlpfwy7m", "name": "sentence-02", "text": "클립의 예제 문장 2입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 8.346213000000002, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 2.246213, "fontSize": 80, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 6.100000000000001, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 5, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "templateGroupId": "template-group-1751156995138-6c8yona3o", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.5999999999999996, "baseClipId": "1751156995138-cbkpl4cp3", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751156995138-cbkpl4cp3", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751156995138-uh1n68c74", "name": "sentence-03", "text": "클립의 예제 문장 3입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 10.276848, "mediaId": "sentence-1750598868711", "opacity": 1, "trackId": "track-1", "duration": 1.61, "fontSize": 80, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 8.666848000000002, "textAlign": "center", "fontFamily": "BM DoHyeon", "textSegments": [], "totalSegments": 0, "segmentVersion": 5, "backgroundColor": "rgba(0, 0, 0, 0.7)", "templateGroupId": "template-group-1751156995138-6c8yona3o", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.4768480000000004, "baseClipId": "1751156995138-as7xs6n8o", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751156995138-as7xs6n8o", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751156995138-t4yzsg9j2", "name": "sentence-04", "text": "클립의 예제 문장 4입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 12.047052, "mediaId": "sentence-1750598940609", "opacity": 1, "trackId": "track-1", "duration": 1.197052, "fontSize": 82, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 10.85, "fontFamily": "Times New Roman", "textSegments": [], "totalSegments": 0, "segmentVersion": 8, "backgroundColor": "rgba(0, 0, 0, 0.7)", "templateGroupId": "template-group-1751156995138-6c8yona3o", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.5499999999999998, "baseClipId": "1751156995138-bucn9rw9j", "anchorPoint": "end"}, "startAnchor": {"offset": 0.25, "baseClipId": "1751156995138-bucn9rw9j", "anchorPoint": "start"}}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"x": 480, "y": 490, "id": "1751156995138-4nhngxk1h", "name": "text-intro", "text": "집중하세요", "color": "#FFFFFF", "width": 960, "height": 100, "endTime": 1.97, "mediaId": "text-1750876786324", "opacity": 1, "trackId": "track-3", "duration": 1.97, "fontSize": 85, "rotation": 0, "mediaType": "text", "startTime": 0, "fontFamily": "Arial, sans-serif", "backgroundColor": "rgba(0, 0, 0, 0.7)", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": false, "dynamicLengthSource": "static"}}, {"id": "1751156995138-6rjm90u4x", "name": "audio-outer01", "volume": 1, "endTime": 3.397052, "mediaId": "04c288aa", "trackId": "track-3", "duration": 0.897052, "mediaUrl": "/uploads/04c288aa-dccd-45a3-9495-714a6843fe19-76515e0fca2d11126de1e2a9dce10696.wav", "mediaType": "audio", "startTime": 2.5, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"sourceData": "text", "propertyName": "mediaUrl"}], "dynamicLengthSource": "media"}}, {"id": "1751156995138-lb96u676f", "name": "audio-01", "volume": 1, "endTime": 5.468912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "isGrouped": true, "mediaType": "audio", "startTime": 4.350000000000001, "playbackRate": 1, "templateGroupId": "template-group-1751156995138-6c8yona3o", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751156995138-cbkpl4cp3", "name": "audio-02", "volume": 1, "endTime": 7.746213, "mediaId": "23dac0c8", "trackId": "track-3", "bundleId": "bundle_1750869729062_4rlp54lzg", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "isBundled": true, "isGrouped": true, "mediaType": "audio", "startTime": 6.100000000000001, "playbackRate": 1, "templateGroupId": "template-group-1751156995138-6c8yona3o", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751156995138-as7xs6n8o", "name": "audio-03", "volume": 1, "endTime": 9.8, "mediaId": "d3f1808c", "trackId": "track-3", "bundleId": "bundle_1750869729062_4rlp54lzg", "duration": 1.133152, "mediaUrl": "/uploads/d3f1808c-484e-4516-83da-b9cfc7a3b059-6289812c5370f9842ebec1cc32ef1a02.wav", "isBundled": true, "isGrouped": true, "mediaType": "audio", "startTime": 8.666848000000002, "playbackRate": 1, "templateGroupId": "template-group-1751156995138-6c8yona3o", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751156995138-bucn9rw9j", "name": "audio-04", "volume": 1, "endTime": 11.497052, "mediaId": "04c288aa", "trackId": "track-3", "duration": 0.897052, "mediaUrl": "/uploads/04c288aa-dccd-45a3-9495-714a6843fe19-76515e0fca2d11126de1e2a9dce10696.wav", "isGrouped": true, "mediaType": "audio", "startTime": 10.6, "playbackRate": 1, "templateGroupId": "template-group-1751156995138-6c8yona3o", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}, {"id": "1750876744440-2iv4ua1y8", "name": "track-1750876744440", "clips": [{"x": 0, "y": 0, "id": "1751156995138-5fnjfphlz", "name": "polygon-outer01", "width": 1920, "height": 1080, "endTime": 12.047052, "mediaId": "polygonShape-1750876808839", "opacity": 1, "trackId": "1750876744440-2iv4ua1y8", "duration": 12.047052, "rotation": 0, "mediaType": "polygonShape", "startTime": 0, "regularClipProperties": {"endAnchorExtended": {"offset": 0, "baseClipId": "", "anchorPoint": "end", "templateGroupId": "template-group-1751156995138-6c8yona3o"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1751156995138-4nhngxk1h", "anchorPoint": "start"}}, "polygonShapeProperties": {"shapeType": "rectangle", "backgroundType": "color", "backgroundColor": "#3b82f6"}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 2"}], "bundles": [{"id": "bundle_1750876740126_xtcmqnp9h", "name": "bundle-inner-middle", "color": "#DDA0DD", "endTime": 5.699999999999999, "createdAt": 1750876740126, "startTime": 2, "baseClipIds": ["1751156995138-cbkpl4cp3", "1751156995138-as7xs6n8o"], "templateGroupIds": []}], "templateGroups": [{"id": "template-group-1751156995138-6c8yona3o", "name": "template-inner-bundle", "color": "#4CAF50", "clipIds": ["1751156995138-derwir7ul", "1751156995138-gdlpfwy7m", "1751156995138-uh1n68c74", "1751156995138-t4yzsg9j2", "1751156995138-lb96u676f", "1751156995138-cbkpl4cp3", "1751156995138-as7xs6n8o", "1751156995138-bucn9rw9j"], "endTime": 12.047052, "metadata": {"importedAt": "2025-06-25T18:39:00.125Z", "preservesBundles": true, "sourceTemplateId": "1739109e-e31b-44f0-ab3b-4dfd8872ea80"}, "createdAt": 1750876740125, "startTime": 4.100000000000001, "templateId": "1739109e-e31b-44f0-ab3b-4dfd8872ea80", "isProtected": true, "bundleMappings": [{"newBundleId": "bundle-1750876740125-2piiodt0x", "clipIdMappings": {"1750872425601-rh6ruwkq3": "1750876740123-4t3tloxr1", "1750872425601-un0sckx20": "1750876740123-9fb2kybwe"}, "originalBundleId": "bundle_1750869729062_4rlp54lzg", "preservedInGroup": true}], "originalBundles": [{"id": "bundle_1750869729062_4rlp54lzg", "name": "bundle-inner-middle", "color": "#DDA0DD", "endTime": 5.899999999999999, "createdAt": 1750869729062, "startTime": 2, "baseClipIds": ["1750872425601-un0sckx20", "1750872425601-rh6ruwkq3"], "templateGroupIds": []}]}], "projectSettings": {"fps": 30, "width": 1920, "height": 1080, "duration": 60, "backgroundColor": "#000000"}}	1	1.1.0	t	2025-06-29 23:38:53.757
b99e6596-3460-4f24-ae94-43709600bad5	8c7f6d00-ab37-4319-918d-1ecf9878c715	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 240, "y": 480, "id": "1750969146713-wcfrvuc6e", "name": "sentence-01", "text": "클립의 예제 문장 1입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 1.678912, "mediaId": "sentence-1750598755891", "opacity": 1, "trackId": "track-1", "duration": 1.678912, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 0, "textAlign": "center", "fontFamily": "Nanum Barun Pen", "paddingTop": 14, "textShadow": "2px 2px 4px rgba(0,0,0,0.8)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 6, "backgroundColor": "linear-gradient(45deg, #667eea, #764ba2)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}], "endAnchorExtended": {"offset": 0.3100000000000001, "baseClipId": "1750969146713-pg3ichuxh", "anchorPoint": "end"}, "startAnchorExtended": {"offset": -0.25, "baseClipId": "1750969146713-pg3ichuxh", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1750969146713-y0kzmm3pc", "name": "sentence-02", "text": "클립의 예제 문장 2입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 4.246213, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 2.246213, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 2, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 5, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.5999999999999996, "baseClipId": "1750969146713-maoxzqrpw", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1750969146713-maoxzqrpw", "anchorPoint": "start"}, "dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}]}}, {"x": 240, "y": 480, "id": "1750969146713-k1lnwlrbg", "name": "sentence-03", "text": "클립의 예제 문장 3입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 6.176848, "mediaId": "sentence-1750598868711", "opacity": 1, "trackId": "track-1", "duration": 1.61, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 4.566847999999999, "textAlign": "center", "fontFamily": "BM DoHyeon", "textSegments": [], "totalSegments": 0, "segmentVersion": 5, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.4768480000000004, "baseClipId": "1750969146713-d4805jizu", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1750969146713-d4805jizu", "anchorPoint": "start"}, "dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}]}}, {"x": 240, "y": 480, "id": "1750969146713-gfwv0w4p9", "name": "sentence-04", "text": "클립의 예제 문장 4입니다.", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 7.947052, "mediaId": "sentence-1750598940609", "opacity": 1, "trackId": "track-1", "duration": 1.197052, "fontSize": 82, "rotation": 0, "mediaType": "sentence", "startTime": 6.75, "fontFamily": "Times New Roman", "textSegments": [], "totalSegments": 0, "segmentVersion": 8, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.5499999999999998, "baseClipId": "1750969146713-acv8c7n20", "anchorPoint": "end"}, "startAnchor": {"offset": 0.25, "baseClipId": "1750969146713-acv8c7n20", "anchorPoint": "start"}, "dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}]}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"id": "1750969146713-pg3ichuxh", "name": "audio-01", "volume": 1, "endTime": 1.368912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "mediaType": "audio", "startTime": 0.25, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "1750969146713-maoxzqrpw", "name": "audio-02", "volume": 1, "endTime": 3.646213, "mediaId": "23dac0c8", "trackId": "track-3", "bundleId": "bundle_1750869729062_4rlp54lzg", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "isBundled": true, "mediaType": "audio", "startTime": 2, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "1750969146713-d4805jizu", "name": "audio-03", "volume": 1, "endTime": 5.699999999999999, "mediaId": "d3f1808c", "trackId": "track-3", "bundleId": "bundle_1750869729062_4rlp54lzg", "duration": 1.133152, "mediaUrl": "/uploads/d3f1808c-484e-4516-83da-b9cfc7a3b059-6289812c5370f9842ebec1cc32ef1a02.wav", "isBundled": true, "mediaType": "audio", "startTime": 4.566847999999999, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "1750969146713-acv8c7n20", "name": "audio-04", "volume": 1, "endTime": 7.397052, "mediaId": "04c288aa", "trackId": "track-3", "duration": 0.897052, "mediaUrl": "/uploads/04c288aa-dccd-45a3-9495-714a6843fe19-76515e0fca2d11126de1e2a9dce10696.wav", "mediaType": "audio", "startTime": 6.5, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}], "bundles": [{"id": "bundle_1750869729062_4rlp54lzg", "name": "bundle-inner-middle", "color": "#DDA0DD", "endTime": 5.899999999999999, "createdAt": 1750869729062, "startTime": 2, "baseClipIds": ["1750969146713-maoxzqrpw", "1750969146713-d4805jizu"], "templateGroupIds": []}], "templateGroups": [], "projectSettings": {"fps": 30, "width": 1920, "height": 1080, "duration": 10, "backgroundColor": "#000000"}}	1	1.1.0	t	2025-06-29 23:40:56.886
886f4735-bdd7-4ba8-a3d0-3dd9d544fbfb	4eb1d97b-f02e-4d20-b329-cb2c8e40b630	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 240, "y": 480, "id": "1751252247937-pg7d3pr6b", "name": "sentence-01", "text": "클립의 예제 문장 1입니다. before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 2, "mediaId": "sentence-1750598755891", "opacity": 1, "trackId": "track-1", "duration": 1.678912, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 0.321088, "textAlign": "center", "fontFamily": "Nanum Barun Pen", "paddingTop": 14, "textShadow": "2px 2px 4px rgba(0,0,0,0.8)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 35, "backgroundColor": "linear-gradient(45deg, #667eea, #764ba2)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}], "endAnchorExtended": {"offset": 0, "bundleId": "bundle_1750869729062_4rlp54lzg", "anchorPoint": "start"}, "startAnchorExtended": {"offset": 0.07108800000000004, "baseClipId": "1751252247937-s7tqg3n7e", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751252247937-i4xw0wijs", "name": "sentence-02", "text": "클립의 예제 문장 2입니다. before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 4.246213, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 2.246213, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 2, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 7, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.5999999999999996, "baseClipId": "1751252247937-p8bvhea3l", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751252247937-p8bvhea3l", "anchorPoint": "start"}, "dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}]}}, {"x": 240, "y": 480, "id": "1751252247937-m1tv3f7ih", "name": "sentence-03", "text": "클립의 예제 문장 3입니다. before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 6.176848, "mediaId": "sentence-1750598868711", "opacity": 1, "trackId": "track-1", "duration": 1.61, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 4.566847999999999, "textAlign": "center", "fontFamily": "BM DoHyeon", "textSegments": [], "totalSegments": 0, "segmentVersion": 7, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.4768480000000004, "baseClipId": "1751252247937-mpwo4nelf", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751252247937-mpwo4nelf", "anchorPoint": "start"}, "dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}]}}, {"x": 240, "y": 480, "id": "1751252247937-q5e0s9p1a", "name": "sentence-04", "text": "클립의 예제 문장 4입니다. before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 7.947052, "mediaId": "sentence-1750598940609", "opacity": 1, "trackId": "track-1", "duration": 1.197052, "fontSize": 82, "rotation": 0, "mediaType": "sentence", "startTime": 6.75, "fontFamily": "Times New Roman", "textSegments": [], "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.5499999999999998, "baseClipId": "1751252247937-i7heurc51", "anchorPoint": "end"}, "startAnchor": {"offset": 0.25, "baseClipId": "1751252247937-i7heurc51", "anchorPoint": "start"}, "dynamicProperties": [{"propertyName": "text", "sourceDataType": "text"}]}}, {"x": 200, "y": 250, "id": "clip-1751252496136-mi7a5p24t", "name": "sentence-05", "text": "이 문장은 Sentence 클립의 예제. before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 10.294376, "mediaId": "sentence-1751252496086", "opacity": 1, "trackId": "track-1", "duration": 1.794376, "fontSize": 28, "rotation": 0, "mediaType": "sentence", "startTime": 8.5, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 11, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0.25, "baseClipId": "clip-1751252462061-wx6k96zjm", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0.25, "baseClipId": "clip-1751252462061-wx6k96zjm", "anchorPoint": "start"}}}, {"x": 200, "y": 250, "id": "clip-1751252513805-zf8rd5m1v", "name": "sentence-06", "text": "이 문장은 Sentence 클립의 예제 문장입니다. before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 11.94, "mediaId": "sentence-1751252513754", "opacity": 1, "trackId": "track-1", "duration": 1.44, "fontSize": 28, "rotation": 0, "mediaType": "sentence", "startTime": 10.5, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0.2426529999999989, "baseClipId": "clip-1751252467029-3wf2t1fpu", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0.25, "baseClipId": "clip-1751252467029-3wf2t1fpu", "anchorPoint": "start"}}}, {"x": 200, "y": 250, "id": "clip-1751252542650-k8lud2u7o", "name": "sentence-07", "text": "이 문장은 Sentence 클립. before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 12.7761, "mediaId": "sentence-1751252542598", "opacity": 1, "trackId": "track-1", "duration": 0.7760999999999996, "fontSize": 28, "rotation": 0, "mediaType": "sentence", "startTime": 12, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 15, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "clip-1751252478113-p21akk6a8", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "clip-1751252478113-p21akk6a8", "anchorPoint": "start"}}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"id": "1751252247937-s7tqg3n7e", "name": "audio-01", "volume": 1, "endTime": 1.368912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "mediaType": "audio", "startTime": 0.25, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "1751252247937-p8bvhea3l", "name": "audio-02", "volume": 1, "endTime": 3.646213, "mediaId": "23dac0c8", "trackId": "track-3", "bundleId": "bundle_1750869729062_4rlp54lzg", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "isBundled": true, "mediaType": "audio", "startTime": 2, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "1751252247937-mpwo4nelf", "name": "audio-03", "volume": 1, "endTime": 5.699999999999999, "mediaId": "d3f1808c", "trackId": "track-3", "bundleId": "bundle_1750869729062_4rlp54lzg", "duration": 1.133152, "mediaUrl": "/uploads/d3f1808c-484e-4516-83da-b9cfc7a3b059-6289812c5370f9842ebec1cc32ef1a02.wav", "isBundled": true, "mediaType": "audio", "startTime": 4.566847999999999, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "1751252247937-i7heurc51", "name": "audio-04", "volume": 1, "endTime": 7.397052, "mediaId": "04c288aa", "trackId": "track-3", "duration": 0.897052, "mediaUrl": "/uploads/04c288aa-dccd-45a3-9495-714a6843fe19-76515e0fca2d11126de1e2a9dce10696.wav", "mediaType": "audio", "startTime": 6.5, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicProperties": [{"propertyName": "mediaUrl", "sourceDataType": "text"}], "dynamicLengthSource": "media"}}, {"id": "clip-1751252462061-wx6k96zjm", "name": "audio-05", "volume": 1, "endTime": 10.044376, "mediaId": "61349adf-7e3c-42d1-abfe-9ee228da5c24", "trackId": "track-3", "bundleId": "bundle_1751252604145_1td3kq0ac", "duration": 1.794376, "mediaUrl": "/uploads/c0a0e96a-8938-477c-a2a3-2eb53cdf3a95-9c557d1363581616227b31e672046c7c.wav", "isBundled": true, "mediaType": "audio", "startTime": 8.25, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "dynamicProperties": []}}, {"id": "clip-1751252467029-3wf2t1fpu", "name": "audio-06", "volume": 1, "endTime": 11.697347, "mediaId": "a1f8976b-0db3-41b6-94a4-b35b51d7a86a", "trackId": "track-3", "bundleId": "bundle_1751252604145_1td3kq0ac", "duration": 1.447347, "mediaUrl": "/uploads/0220e625-2198-4919-8f90-14f506b14d30-3104c9311a79161a3f6684b473997694.wav", "isBundled": true, "mediaType": "audio", "startTime": 10.25, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "dynamicProperties": []}}, {"id": "clip-1751252478113-p21akk6a8", "name": "audio-07", "volume": 1, "endTime": 12.7761, "mediaId": "83563d3d-b91d-4d33-b993-261020035c81", "trackId": "track-3", "duration": 0.7761, "mediaUrl": "/uploads/f63b7f33-100b-4008-9a98-b6d95745dbbf-0b01f5a31a88777c6a1d3e4641deea06.wav", "mediaType": "audio", "startTime": 12, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "dynamicProperties": []}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}], "bundles": [{"id": "bundle_1750869729062_4rlp54lzg", "name": "bundle-inner-middle", "color": "#DDA0DD", "endTime": 5.899999999999999, "createdAt": 1750869729062, "startTime": 2, "baseClipIds": ["1751252247937-p8bvhea3l", "1751252247937-mpwo4nelf"], "templateGroupIds": []}, {"id": "bundle_1751252604145_1td3kq0ac", "name": "bundle-inner-right", "color": "#F7DC6F", "endTime": 11.697347, "createdAt": 1751252604145, "startTime": 8.25, "baseClipIds": ["clip-1751252462061-wx6k96zjm", "clip-1751252467029-3wf2t1fpu"], "templateGroupIds": []}], "templateGroups": [], "projectSettings": {"fps": 30, "width": 1920, "height": 1080, "duration": 10, "backgroundColor": "#000000"}}	1	1.1.0	t	2025-06-30 03:12:31.994
badbce95-69be-4e56-82b9-d373f37a2f89	10e56183-20a9-491a-9696-b5fe17bac533	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 200, "y": 250, "id": "clip-1751257615510-terjk46sm", "name": "sentence-01", "text": "이 문장은 Sentence  before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 1.118912, "mediaId": "sentence-1751257615458", "opacity": 1, "trackId": "track-1", "duration": 1.118912, "fontSize": 28, "rotation": 0, "mediaType": "sentence", "startTime": 0, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "1750606850382-urgvk9iym", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1750606850382-urgvk9iym", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1750606850382-5xbhu23f7", "name": "sentence-02", "text": "이 문장은 Sentence 클립의 . before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 3.995124999999999, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 1.876212999999999, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 2.118912, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.23, "baseClipId": "1750606850382-xvzjbdb6z", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1750606850382-xvzjbdb6z", "anchorPoint": "start"}}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"id": "1750606850382-urgvk9iym", "name": "5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "volume": 1, "endTime": 1.118912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "mediaType": "audio", "startTime": 0, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1750606850382-xvzjbdb6z", "name": "audio-02", "volume": 1, "endTime": 3.765124999999999, "mediaId": "23dac0c8", "trackId": "track-3", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "mediaType": "audio", "startTime": 2.118912, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}], "bundles": [], "templateGroups": [], "projectSettings": {"fps": 30, "width": 1920, "height": 1080, "duration": 4.5, "backgroundColor": "#000000"}}	1	1.0.0	f	2025-06-30 04:35:38.856
dad6b714-7767-465d-9512-1345f4f07c10	10e56183-20a9-491a-9696-b5fe17bac533	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 240, "y": 480, "id": "1750606850382-5xbhu23f7", "name": "sentence-02", "text": "이 문장은 Sentence 클립의 . before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 3.995124999999999, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 1.876212999999999, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 2.118912, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.23, "baseClipId": "1750606850382-xvzjbdb6z", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1750606850382-xvzjbdb6z", "anchorPoint": "start"}}}, {"x": 200, "y": 250, "id": "clip-1751257615510-terjk46sm", "name": "sentence-01", "text": "이 문장은 Sentence  before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 1.118912, "mediaId": "sentence-1751257615458", "opacity": 1, "trackId": "track-1", "duration": 1.118912, "fontSize": 28, "rotation": 0, "mediaType": "sentence", "startTime": 0, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "1750606850382-urgvk9iym", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1750606850382-urgvk9iym", "anchorPoint": "start"}}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"id": "1750606850382-urgvk9iym", "name": "audio-01", "volume": 1, "endTime": 1.118912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "mediaType": "audio", "startTime": 0, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1750606850382-xvzjbdb6z", "name": "audio-02", "volume": 1, "endTime": 3.765124999999999, "mediaId": "23dac0c8", "trackId": "track-3", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "mediaType": "audio", "startTime": 2.118912, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}], "bundles": [], "templateGroups": [], "projectSettings": {"fps": 30, "width": 1920, "height": 1080, "duration": 4.5, "backgroundColor": "#000000"}}	2	1.0.0	t	2025-06-30 04:36:48.759
3d4d752f-7f55-4d47-af63-75971cfde89e	6ffd527d-a1fb-487e-b988-e437c7dbbd7e	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 240, "y": 480, "id": "1750606850382-5xbhu23f7", "name": "sentence-04", "text": "이 문장은 Sentence 클립의 . before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 8.376213, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 1.876212999999999, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 6.5, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.23, "baseClipId": "1750606850382-xvzjbdb6z", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1750606850382-xvzjbdb6z", "anchorPoint": "start"}}}, {"x": 200, "y": 250, "id": "clip-1751257615510-terjk46sm", "name": "sentence-01", "text": "이 문장은 Sentence  before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 1.118912, "mediaId": "sentence-1751257615458", "opacity": 1, "trackId": "track-1", "duration": 1.118912, "fontSize": 28, "rotation": 0, "mediaType": "sentence", "startTime": 0, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "1750606850382-urgvk9iym", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1750606850382-urgvk9iym", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751258426923-2sllcpkzm", "name": "sentence-02", "text": "이 문장은 Sentence 클립의 . before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 5.795124999999999, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 1.876212999999999, "fontSize": 80, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 3.918912, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "templateGroupId": "template-group-1751258426924-sz6kz7x6f", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.23, "baseClipId": "1751258426923-8ngw8n6qm", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751258426923-8ngw8n6qm", "anchorPoint": "start"}}}, {"x": 200, "y": 250, "id": "1751258426923-mt08citfw", "name": "sentence-01", "text": "이 문장은 Sentence  before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 2.918912, "mediaId": "sentence-1751257615458", "opacity": 1, "trackId": "track-1", "duration": 1.118912, "fontSize": 28, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 1.8, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "templateGroupId": "template-group-1751258426924-sz6kz7x6f", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "1751258426923-cchk3lvsw", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1751258426923-cchk3lvsw", "anchorPoint": "start"}}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"id": "1750606850382-urgvk9iym", "name": "audio-01", "volume": 1, "endTime": 1.118912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "mediaType": "audio", "startTime": 0, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1750606850382-xvzjbdb6z", "name": "audio-04", "volume": 1, "endTime": 8.146213, "mediaId": "23dac0c8", "trackId": "track-3", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "mediaType": "audio", "startTime": 6.5, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751258426923-cchk3lvsw", "name": "audio-01", "volume": 1, "endTime": 2.918912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "isGrouped": true, "mediaType": "audio", "startTime": 1.8, "playbackRate": 1, "templateGroupId": "template-group-1751258426924-sz6kz7x6f", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751258426923-8ngw8n6qm", "name": "audio-02", "volume": 1, "endTime": 5.565124999999999, "mediaId": "23dac0c8", "trackId": "track-3", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "isGrouped": true, "mediaType": "audio", "startTime": 3.918912, "playbackRate": 1, "templateGroupId": "template-group-1751258426924-sz6kz7x6f", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}], "bundles": [], "templateGroups": [{"id": "template-group-1751258426924-sz6kz7x6f", "name": "template-inner-middle", "color": "#4CAF50", "clipIds": ["1751258426923-2sllcpkzm", "1751258426923-mt08citfw", "1751258426923-cchk3lvsw", "1751258426923-8ngw8n6qm"], "endTime": 5.795124999999999, "metadata": {"importedAt": "2025-06-30T04:40:26.924Z", "preservesBundles": true, "sourceTemplateId": "10e56183-20a9-491a-9696-b5fe17bac533"}, "createdAt": 1751258426924, "startTime": 1.8, "templateId": "10e56183-20a9-491a-9696-b5fe17bac533", "isProtected": true, "bundleMappings": [], "originalBundles": []}], "projectSettings": {"fps": 30, "width": 1920, "height": 1080, "duration": 9, "backgroundColor": "#000000"}}	1	1.1.0	f	2025-06-30 04:44:16.465
2a9f874f-586f-47bb-a0fe-c0d1a2a2656d	6ffd527d-a1fb-487e-b988-e437c7dbbd7e	{"tracks": [{"id": "track-1", "name": "track-1", "clips": [{"x": 240, "y": 480, "id": "1751465132933-yg0jj92so", "name": "sentence-04", "text": "이 문장은 Sentence 클립의 . before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 8.376213, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 1.876212999999999, "fontSize": 80, "rotation": 0, "mediaType": "sentence", "startTime": 6.5, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.23, "baseClipId": "1751465132933-wj0yfdfs0", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751465132933-wj0yfdfs0", "anchorPoint": "start"}, "dynamicProperties": [{"sourceData": "text", "propertyName": "text"}]}}, {"x": 192, "y": 300, "id": "1751465132933-cajmhmo9u", "name": "sentence-01", "text": "이 문장은 Sentence  before", "color": "#FFFFFF", "width": 896, "height": 120, "endTime": 1.118912, "mediaId": "sentence-1751257615458", "opacity": 1, "trackId": "track-1", "duration": 1.118912, "fontSize": 70, "rotation": 0, "mediaType": "sentence", "startTime": 0, "fontFamily": "Nanum Square", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [{"sourceData": "text", "propertyName": "text"}], "endAnchorExtended": {"offset": 0, "baseClipId": "1751465132933-3w264mkh7", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1751465132933-3w264mkh7", "anchorPoint": "start"}}}, {"x": 240, "y": 480, "id": "1751465132933-mhcywtx94", "name": "sentence-02", "text": "이 문장은 Sentence 클립의 . before", "color": "#FFFFFF", "width": 1440, "height": 120, "endTime": 5.795124999999999, "mediaId": "sentence-1750598795221", "opacity": 1, "trackId": "track-1", "duration": 1.876212999999999, "fontSize": 80, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 3.918912, "textAlign": "center", "fontFamily": "Helvetica", "paddingTop": 14, "textShadow": "3px 3px 6px rgba(0,0,0,0.9)", "paddingLeft": 20, "borderRadius": 8, "paddingRight": 20, "textSegments": [], "paddingBottom": 14, "totalSegments": 0, "segmentVersion": 10, "backgroundColor": "linear-gradient(45deg, #3498db, #9b59b6)", "templateGroupId": "template-group-1751465132933-eskmst5c6", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontSize": 28, "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"endAnchor": {"offset": 0.23, "baseClipId": "1751465132933-z0v0g9msw", "anchorPoint": "end"}, "startAnchor": {"offset": 0, "baseClipId": "1751465132933-z0v0g9msw", "anchorPoint": "start"}}}, {"x": 200, "y": 250, "id": "1751465132933-h39i353fw", "name": "sentence-01", "text": "이 문장은 Sentence  before", "color": "#FFFFFF", "width": 600, "height": 120, "endTime": 2.918912, "mediaId": "sentence-1751257615458", "opacity": 1, "trackId": "track-1", "duration": 1.118912, "fontSize": 28, "rotation": 0, "isGrouped": true, "mediaType": "sentence", "startTime": 1.8, "fontFamily": "Arial, sans-serif", "textSegments": [], "totalSegments": 0, "segmentVersion": 3, "backgroundColor": "rgba(0, 0, 0, 0.7)", "templateGroupId": "template-group-1751465132933-eskmst5c6", "segmentOverlapMode": "priority", "defaultSegmentStyle": {"color": "#FFFFFF", "fontStyle": "normal", "fontFamily": "Arial, sans-serif", "fontWeight": "normal"}, "enableRealTimePreview": true, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "1751465132933-1vhq1lckw", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1751465132933-1vhq1lckw", "anchorPoint": "start"}}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 1"}, {"id": "track-2", "name": "track-2", "clips": [], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Track 2"}, {"id": "track-3", "name": "track-3", "clips": [{"id": "1751465132933-3w264mkh7", "name": "audio-01", "volume": 1, "endTime": 1.118912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "mediaType": "audio", "startTime": 0, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751465132933-wj0yfdfs0", "name": "audio-04", "volume": 1, "endTime": 8.146213, "mediaId": "23dac0c8", "trackId": "track-3", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "mediaType": "audio", "startTime": 6.5, "playbackRate": 1, "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751465132933-1vhq1lckw", "name": "audio-01", "volume": 1, "endTime": 2.918912, "mediaId": "5f38e2a8", "trackId": "track-3", "duration": 1.118912, "mediaUrl": "/uploads/5f38e2a8-c79e-4cdf-bec3-46a97cc9a528-4258651911d5cc730d28f02ce90b4a69.wav", "isGrouped": true, "mediaType": "audio", "startTime": 1.8, "playbackRate": 1, "templateGroupId": "template-group-1751465132933-eskmst5c6", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}, {"id": "1751465132933-z0v0g9msw", "name": "audio-02", "volume": 1, "endTime": 5.565124999999999, "mediaId": "23dac0c8", "trackId": "track-3", "duration": 1.646213, "mediaUrl": "/uploads/23dac0c8-188e-40bc-814f-87b3a0ae783f-323879187c96286f35f4b6596f37e501.wav", "isGrouped": true, "mediaType": "audio", "startTime": 3.918912, "playbackRate": 1, "templateGroupId": "template-group-1751465132933-eskmst5c6", "baseClipProperties": {"isBaseClip": true, "isDynamicLength": true, "dynamicLengthSource": "media"}}], "height": 80, "isLocked": false, "baseClips": [], "isVisible": true, "displayName": "Base Track 1", "isBaseTrack": true}, {"id": "track-4", "name": "track-4", "clips": [{"x": 0, "y": 0, "id": "clip-1751465173274-cpec2ljxz", "name": "다각형", "width": 1280, "height": 720, "endTime": 8.146213, "mediaId": "polygonShape-1751465173222", "opacity": 0.41, "trackId": "track-4", "duration": 8.146213, "mediaUrl": "blob:http://localhost:3010/b3670af5-b884-47d8-8ab9-c7f8614d91be", "rotation": 0, "mediaType": "polygonShape", "startTime": 0, "regularClipProperties": {"isBaseClip": false, "dynamicProperties": [], "endAnchorExtended": {"offset": 0, "baseClipId": "1751465132933-wj0yfdfs0", "anchorPoint": "end"}, "startAnchorExtended": {"offset": 0, "baseClipId": "1751465132933-3w264mkh7", "anchorPoint": "start"}}, "polygonShapeProperties": {"edgeFade": 0, "fadeType": "radial", "shapeType": "rectangle", "borderRadius": 0, "backgroundFit": "fill", "backgroundType": "image", "backgroundColor": "#3b82f6", "borderRadiusUnit": "px", "backgroundImageUrl": "/uploads/14855582-4386-4059-8a22-672dc32fb993-Screenshot 2025-03-20 at 9.20.41 AM.png", "backgroundPosition": "center"}}], "height": 80, "isLocked": false, "isVisible": true, "displayName": "Background 1"}], "bundles": [], "templateGroups": [{"id": "template-group-1751465132933-eskmst5c6", "name": "template-inner-middle", "color": "#4CAF50", "clipIds": ["1751465132933-mhcywtx94", "1751465132933-h39i353fw", "1751465132933-1vhq1lckw", "1751465132933-z0v0g9msw"], "endTime": 5.795124999999999, "metadata": {"importedAt": "2025-06-30T04:40:26.924Z", "preservesBundles": true, "sourceTemplateId": "10e56183-20a9-491a-9696-b5fe17bac533"}, "createdAt": 1751258426924, "startTime": 1.8, "templateId": "10e56183-20a9-491a-9696-b5fe17bac533", "isProtected": true, "bundleMappings": [], "originalBundles": []}], "projectSettings": {"fps": 30, "width": 1280, "height": 720, "duration": 9, "backgroundColor": "#000000"}}	2	1.1.0	t	2025-07-02 14:12:54.298
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e84e6636-c39f-4ae2-8a9d-fd0c844de193	ca5f0770a8911376425409a3d086859fdb0caf5ed0dfbb547c1a58ec851fbfcd	2025-07-02 17:04:55.727528-07	20250623182700_init	\N	\N	2025-07-02 17:04:55.705113-07	1
f12a89dd-efb4-42bb-ae8e-bd0afd93bf12	8aab3a4bf83289a993b327106f51960ad675077791b1041a6e7358ea0459fa8f	2025-07-02 17:04:55.731193-07	20250623232835_add_template_types	\N	\N	2025-07-02 17:04:55.72785-07	1
27ed5485-dd97-4058-aca6-8ea92bddd238	af6c35a999b6d91b27a4214e81242d89382c7b8392f6b2542e90807a2decec10	2025-07-02 17:04:55.735448-07	20250627154953_add_resource_data_model	\N	\N	2025-07-02 17:04:55.731523-07	1
46f8f5c2-e479-4eae-8d9c-d9e4e4a7f26f	ca5f0770a8911376425409a3d086859fdb0caf5ed0dfbb547c1a58ec851fbfcd	2025-06-29 16:22:38.465526-07	20250623182700_init	\N	\N	2025-06-29 16:22:38.442703-07	1
2269d0e5-a87c-4c4f-8369-2d1b2658ee0b	8aab3a4bf83289a993b327106f51960ad675077791b1041a6e7358ea0459fa8f	2025-06-29 16:22:38.471307-07	20250623232835_add_template_types	\N	\N	2025-06-29 16:22:38.465958-07	1
3c88c35a-5afc-4261-b9f5-554bef9c9641	af6c35a999b6d91b27a4214e81242d89382c7b8392f6b2542e90807a2decec10	2025-06-29 16:22:38.476454-07	20250627154953_add_resource_data_model	\N	\N	2025-06-29 16:22:38.471686-07	1
\.


--
-- Data for Name: template_resource_compatibility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_resource_compatibility (id, "templateId", "resourceId", "createdAt", "updatedAt") FROM stdin;
886c421d-928e-4f75-8534-efd49b677aea	8c7f6d00-ab37-4319-918d-1ecf9878c715	acaf4d80-48be-433b-85d8-24f4b50a71c2	2025-06-30 01:50:51.382	2025-06-30 01:50:51.382
34b8aafb-4975-422e-91a6-29c17a05a69b	4eb1d97b-f02e-4d20-b329-cb2c8e40b630	da52124a-43d9-4aa0-830f-4f08316a7bb1	2025-06-30 03:26:04.748	2025-06-30 03:26:04.748
dd41afeb-c4d3-464d-a795-0eeb7cc8f58d	6ffd527d-a1fb-487e-b988-e437c7dbbd7e	5bf8713b-0085-4adb-afde-713a96e542d5	2025-06-30 04:51:09.564	2025-06-30 04:51:09.564
909cc645-7d69-4573-b473-3f2110158f5e	2a1e28a6-ad51-444a-aa06-46ab335398db	6b323dd9-0d5d-4a61-8585-34eff556526b	2025-06-30 17:30:33.856	2025-06-30 17:30:33.856
\.


--
-- Name: AudioMapping AudioMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AudioMapping"
    ADD CONSTRAINT "AudioMapping_pkey" PRIMARY KEY (id);


--
-- Name: Bundle Bundle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bundle"
    ADD CONSTRAINT "Bundle_pkey" PRIMARY KEY (id);


--
-- Name: CsvColumnMapVersion CsvColumnMapVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CsvColumnMapVersion"
    ADD CONSTRAINT "CsvColumnMapVersion_pkey" PRIMARY KEY (id);


--
-- Name: CsvColumnMap CsvColumnMap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CsvColumnMap"
    ADD CONSTRAINT "CsvColumnMap_pkey" PRIMARY KEY (id);


--
-- Name: MediaFile MediaFile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MediaFile"
    ADD CONSTRAINT "MediaFile_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: RenderResult RenderResult_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RenderResult"
    ADD CONSTRAINT "RenderResult_pkey" PRIMARY KEY (id);


--
-- Name: ResourceDataVersion ResourceDataVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceDataVersion"
    ADD CONSTRAINT "ResourceDataVersion_pkey" PRIMARY KEY (id);


--
-- Name: ResourceData ResourceData_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceData"
    ADD CONSTRAINT "ResourceData_pkey" PRIMARY KEY (id);


--
-- Name: ResourceTemplateVersion ResourceTemplateVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceTemplateVersion"
    ADD CONSTRAINT "ResourceTemplateVersion_pkey" PRIMARY KEY (id);


--
-- Name: ResourceTemplate ResourceTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceTemplate"
    ADD CONSTRAINT "ResourceTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Script Script_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Script"
    ADD CONSTRAINT "Script_pkey" PRIMARY KEY (id);


--
-- Name: TemplateGroup TemplateGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TemplateGroup"
    ADD CONSTRAINT "TemplateGroup_pkey" PRIMARY KEY (id);


--
-- Name: TemplateType TemplateType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TemplateType"
    ADD CONSTRAINT "TemplateType_pkey" PRIMARY KEY (id);


--
-- Name: TemplateVersion TemplateVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TemplateVersion"
    ADD CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY (id);


--
-- Name: Template Template_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: template_resource_compatibility template_resource_compatibility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_resource_compatibility
    ADD CONSTRAINT template_resource_compatibility_pkey PRIMARY KEY (id);


--
-- Name: CsvColumnMapVersion_csvMapId_isLatest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CsvColumnMapVersion_csvMapId_isLatest_idx" ON public."CsvColumnMapVersion" USING btree ("csvMapId", "isLatest");


--
-- Name: CsvColumnMapVersion_csvMapId_isLatest_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CsvColumnMapVersion_csvMapId_isLatest_key" ON public."CsvColumnMapVersion" USING btree ("csvMapId", "isLatest");


--
-- Name: CsvColumnMapVersion_csvMapId_version_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CsvColumnMapVersion_csvMapId_version_idx" ON public."CsvColumnMapVersion" USING btree ("csvMapId", version);


--
-- Name: CsvColumnMapVersion_csvMapId_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CsvColumnMapVersion_csvMapId_version_key" ON public."CsvColumnMapVersion" USING btree ("csvMapId", version);


--
-- Name: CsvColumnMap_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CsvColumnMap_createdAt_idx" ON public."CsvColumnMap" USING btree ("createdAt");


--
-- Name: CsvColumnMap_mappingComplexity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CsvColumnMap_mappingComplexity_idx" ON public."CsvColumnMap" USING btree ("mappingComplexity");


--
-- Name: CsvColumnMap_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CsvColumnMap_name_idx" ON public."CsvColumnMap" USING btree (name);


--
-- Name: CsvColumnMap_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CsvColumnMap_name_key" ON public."CsvColumnMap" USING btree (name);


--
-- Name: CsvColumnMap_resourceTemplateId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CsvColumnMap_resourceTemplateId_idx" ON public."CsvColumnMap" USING btree ("resourceTemplateId");


--
-- Name: MediaFile_filename_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MediaFile_filename_idx" ON public."MediaFile" USING btree (filename);


--
-- Name: MediaFile_filename_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MediaFile_filename_key" ON public."MediaFile" USING btree (filename);


--
-- Name: MediaFile_mediaType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MediaFile_mediaType_idx" ON public."MediaFile" USING btree ("mediaType");


--
-- Name: MediaFile_uploadedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MediaFile_uploadedAt_idx" ON public."MediaFile" USING btree ("uploadedAt");


--
-- Name: Project_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_createdAt_idx" ON public."Project" USING btree ("createdAt");


--
-- Name: Project_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_name_idx" ON public."Project" USING btree (name);


--
-- Name: RenderResult_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_createdAt_idx" ON public."RenderResult" USING btree ("createdAt");


--
-- Name: RenderResult_filename_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RenderResult_filename_key" ON public."RenderResult" USING btree (filename);


--
-- Name: RenderResult_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RenderResult_status_idx" ON public."RenderResult" USING btree (status);


--
-- Name: ResourceDataVersion_resourceDataId_isLatest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceDataVersion_resourceDataId_isLatest_idx" ON public."ResourceDataVersion" USING btree ("resourceDataId", "isLatest");


--
-- Name: ResourceDataVersion_resourceDataId_isLatest_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceDataVersion_resourceDataId_isLatest_key" ON public."ResourceDataVersion" USING btree ("resourceDataId", "isLatest");


--
-- Name: ResourceDataVersion_resourceDataId_version_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceDataVersion_resourceDataId_version_idx" ON public."ResourceDataVersion" USING btree ("resourceDataId", version);


--
-- Name: ResourceDataVersion_resourceDataId_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceDataVersion_resourceDataId_version_key" ON public."ResourceDataVersion" USING btree ("resourceDataId", version);


--
-- Name: ResourceData_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceData_createdAt_idx" ON public."ResourceData" USING btree ("createdAt");


--
-- Name: ResourceData_csvMapId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceData_csvMapId_idx" ON public."ResourceData" USING btree ("csvMapId");


--
-- Name: ResourceData_hasNested_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceData_hasNested_idx" ON public."ResourceData" USING btree ("hasNested");


--
-- Name: ResourceData_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceData_name_idx" ON public."ResourceData" USING btree (name);


--
-- Name: ResourceData_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceData_name_key" ON public."ResourceData" USING btree (name);


--
-- Name: ResourceData_resourceTemplateId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceData_resourceTemplateId_idx" ON public."ResourceData" USING btree ("resourceTemplateId");


--
-- Name: ResourceTemplateVersion_resourceTemplateId_isLatest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceTemplateVersion_resourceTemplateId_isLatest_idx" ON public."ResourceTemplateVersion" USING btree ("resourceTemplateId", "isLatest");


--
-- Name: ResourceTemplateVersion_resourceTemplateId_isLatest_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceTemplateVersion_resourceTemplateId_isLatest_key" ON public."ResourceTemplateVersion" USING btree ("resourceTemplateId", "isLatest");


--
-- Name: ResourceTemplateVersion_resourceTemplateId_version_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceTemplateVersion_resourceTemplateId_version_idx" ON public."ResourceTemplateVersion" USING btree ("resourceTemplateId", version);


--
-- Name: ResourceTemplateVersion_resourceTemplateId_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceTemplateVersion_resourceTemplateId_version_key" ON public."ResourceTemplateVersion" USING btree ("resourceTemplateId", version);


--
-- Name: ResourceTemplate_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceTemplate_createdAt_idx" ON public."ResourceTemplate" USING btree ("createdAt");


--
-- Name: ResourceTemplate_hasNested_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceTemplate_hasNested_idx" ON public."ResourceTemplate" USING btree ("hasNested");


--
-- Name: ResourceTemplate_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceTemplate_name_idx" ON public."ResourceTemplate" USING btree (name);


--
-- Name: ResourceTemplate_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceTemplate_name_key" ON public."ResourceTemplate" USING btree (name);


--
-- Name: TemplateType_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TemplateType_name_idx" ON public."TemplateType" USING btree (name);


--
-- Name: TemplateVersion_templateId_isLatest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TemplateVersion_templateId_isLatest_idx" ON public."TemplateVersion" USING btree ("templateId", "isLatest");


--
-- Name: TemplateVersion_templateId_isLatest_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TemplateVersion_templateId_isLatest_key" ON public."TemplateVersion" USING btree ("templateId", "isLatest");


--
-- Name: TemplateVersion_templateId_version_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "TemplateVersion_templateId_version_idx" ON public."TemplateVersion" USING btree ("templateId", version);


--
-- Name: TemplateVersion_templateId_version_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON public."TemplateVersion" USING btree ("templateId", version);


--
-- Name: Template_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Template_createdAt_idx" ON public."Template" USING btree ("createdAt");


--
-- Name: Template_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Template_name_idx" ON public."Template" USING btree (name);


--
-- Name: Template_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Template_name_key" ON public."Template" USING btree (name);


--
-- Name: Template_typeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Template_typeId_idx" ON public."Template" USING btree ("typeId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: template_resource_compatibility_templateId_resourceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "template_resource_compatibility_templateId_resourceId_key" ON public.template_resource_compatibility USING btree ("templateId", "resourceId");


--
-- Name: AudioMapping AudioMapping_scriptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AudioMapping"
    ADD CONSTRAINT "AudioMapping_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES public."Script"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bundle Bundle_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bundle"
    ADD CONSTRAINT "Bundle_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."Template"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CsvColumnMapVersion CsvColumnMapVersion_csvMapId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CsvColumnMapVersion"
    ADD CONSTRAINT "CsvColumnMapVersion_csvMapId_fkey" FOREIGN KEY ("csvMapId") REFERENCES public."CsvColumnMap"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CsvColumnMap CsvColumnMap_resourceTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CsvColumnMap"
    ADD CONSTRAINT "CsvColumnMap_resourceTemplateId_fkey" FOREIGN KEY ("resourceTemplateId") REFERENCES public."ResourceTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CsvColumnMap CsvColumnMap_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CsvColumnMap"
    ADD CONSTRAINT "CsvColumnMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."Template"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ResourceDataVersion ResourceDataVersion_resourceDataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceDataVersion"
    ADD CONSTRAINT "ResourceDataVersion_resourceDataId_fkey" FOREIGN KEY ("resourceDataId") REFERENCES public."ResourceData"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ResourceData ResourceData_csvMapId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceData"
    ADD CONSTRAINT "ResourceData_csvMapId_fkey" FOREIGN KEY ("csvMapId") REFERENCES public."CsvColumnMap"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ResourceData ResourceData_resourceTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceData"
    ADD CONSTRAINT "ResourceData_resourceTemplateId_fkey" FOREIGN KEY ("resourceTemplateId") REFERENCES public."ResourceTemplate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ResourceData ResourceData_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceData"
    ADD CONSTRAINT "ResourceData_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ResourceTemplateVersion ResourceTemplateVersion_resourceTemplateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceTemplateVersion"
    ADD CONSTRAINT "ResourceTemplateVersion_resourceTemplateId_fkey" FOREIGN KEY ("resourceTemplateId") REFERENCES public."ResourceTemplate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ResourceTemplate ResourceTemplate_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceTemplate"
    ADD CONSTRAINT "ResourceTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TemplateGroup TemplateGroup_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TemplateGroup"
    ADD CONSTRAINT "TemplateGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."Template"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TemplateVersion TemplateVersion_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TemplateVersion"
    ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."Template"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Template Template_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public."TemplateType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Template Template_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: template_resource_compatibility template_resource_compatibility_resourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_resource_compatibility
    ADD CONSTRAINT "template_resource_compatibility_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES public."ResourceData"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_resource_compatibility template_resource_compatibility_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_resource_compatibility
    ADD CONSTRAINT "template_resource_compatibility_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."Template"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

