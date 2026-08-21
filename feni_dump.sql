--
-- PostgreSQL database dump
--

\restrict 6b1Aad5cQYkoKVcV3G4H8vFyeiG9s41A9XVvmrGYfcND0cU0STLemGZtiI7nVIy

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

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

ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS fkpvlyfwhomknrbmo2d20src5vi;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS fkgc8j4gasib6afb4jt01g7afya;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS fkfbuugplswvh4n0nvsgmlja42g;
ALTER TABLE IF EXISTS ONLY public.journal_lines DROP CONSTRAINT IF EXISTS fk1mucajfkxo6i8ldmy61xsaf85;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS ukrh7xkir4eucxp7o8djc64q15t;
ALTER TABLE IF EXISTS ONLY public.staff_users DROP CONSTRAINT IF EXISTS uk84ntv1iab9fa9byg67plxw9fb;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS uk7ljglxlj90ln3lbas4kl983m2;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS uk6haje5m8wusvuevg599ovcnpl;
ALTER TABLE IF EXISTS ONLY public.system_alerts DROP CONSTRAINT IF EXISTS system_alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_users DROP CONSTRAINT IF EXISTS staff_users_pkey;
ALTER TABLE IF EXISTS ONLY public.rooms DROP CONSTRAINT IF EXISTS rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_campaigns DROP CONSTRAINT IF EXISTS promo_campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.outbox_events DROP CONSTRAINT IF EXISTS outbox_events_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_lines DROP CONSTRAINT IF EXISTS journal_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.guests DROP CONSTRAINT IF EXISTS guests_pkey;
ALTER TABLE IF EXISTS ONLY public.facility DROP CONSTRAINT IF EXISTS facility_pkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
DROP TABLE IF EXISTS public.system_alerts;
DROP TABLE IF EXISTS public.staff_users;
DROP TABLE IF EXISTS public.rooms;
DROP TABLE IF EXISTS public.promo_campaigns;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.outbox_events;
DROP TABLE IF EXISTS public.journal_lines;
DROP TABLE IF EXISTS public.journal_entries;
DROP TABLE IF EXISTS public.guests;
DROP TABLE IF EXISTS public.facility;
DROP TABLE IF EXISTS public.bookings;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid NOT NULL,
    check_in_date date NOT NULL,
    check_in_time character varying(255),
    check_out_date date NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    payment_method character varying(255) NOT NULL,
    price_override_reason text,
    room_number character varying(255) NOT NULL,
    room_type character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'CHECKED_IN'::character varying,
    total_cost numeric(10,2) NOT NULL,
    guest_id uuid NOT NULL,
    processed_by_id uuid NOT NULL,
    CONSTRAINT bookings_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['CASH'::character varying, 'POS'::character varying, 'TRANSFER'::character varying])::text[]))),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['RESERVED'::character varying, 'CHECKED_IN'::character varying, 'CHECKED_OUT'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: facility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facility (
    id uuid NOT NULL,
    address character varying(255),
    created_at timestamp(6) with time zone NOT NULL,
    name character varying(255) NOT NULL,
    timezone character varying(255)
);


--
-- Name: guests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guests (
    id uuid NOT NULL,
    address character varying(255),
    arriving_from character varying(255),
    email character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    going_to character varying(255),
    id_scan_url character varying(255),
    last_name character varying(255) NOT NULL,
    lga character varying(255),
    nationality character varying(255),
    next_of_kin_phone character varying(255),
    occupation character varying(255),
    passport_no character varying(255),
    phone character varying(255) NOT NULL,
    purpose_of_visit character varying(255),
    state_of_origin character varying(255),
    title character varying(255)
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    entry_type character varying(255) NOT NULL,
    reference_id uuid NOT NULL,
    processed_by_id uuid,
    CONSTRAINT journal_entries_entry_type_check CHECK (((entry_type)::text = ANY ((ARRAY['SALE'::character varying, 'INVENTORY_INTAKE'::character varying, 'BOOKING_PAYMENT'::character varying, 'VOID_SALE'::character varying])::text[])))
);


--
-- Name: journal_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_lines (
    id uuid NOT NULL,
    account_name character varying(255) NOT NULL,
    credit_amount numeric(10,2),
    debit_amount numeric(10,2),
    journal_entry_id uuid NOT NULL
);


--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbox_events (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    event_type character varying(255) NOT NULL,
    payload text NOT NULL,
    retry_count integer,
    status character varying(255) NOT NULL,
    synced_at timestamp(6) with time zone,
    CONSTRAINT outbox_events_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SYNCED'::character varying, 'FAILED'::character varying])::text[])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    internal_sku character varying(255) NOT NULL,
    low_stock_threshold integer,
    manufacturer_barcode character varying(255),
    name character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    revenue_center character varying(255) NOT NULL,
    stock_qty integer,
    type character varying(255) NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    CONSTRAINT products_revenue_center_check CHECK (((revenue_center)::text = ANY ((ARRAY['ROOMS'::character varying, 'BAR'::character varying, 'KITCHEN'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT products_type_check CHECK (((type)::text = ANY ((ARRAY['RAW_GOOD'::character varying, 'PREPARED_DISH'::character varying])::text[])))
);


--
-- Name: promo_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_campaigns (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    end_date date NOT NULL,
    is_active boolean NOT NULL,
    name character varying(255) NOT NULL,
    start_date date NOT NULL,
    target_room_type character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    base_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    room_number character varying(255) NOT NULL,
    room_type character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT rooms_status_check CHECK (((status)::text = ANY ((ARRAY['AVAILABLE'::character varying, 'OCCUPIED'::character varying, 'DIRTY'::character varying, 'OUT_OF_ORDER'::character varying])::text[])))
);


--
-- Name: staff_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_users (
    id uuid NOT NULL,
    active boolean NOT NULL,
    must_change_password boolean NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    CONSTRAINT staff_users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'INVENTORY_MANAGER'::character varying, 'FRONT_DESK'::character varying, 'BARTENDER'::character varying, 'HOUSEKEEPER'::character varying])::text[])))
);


--
-- Name: system_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_alerts (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    email_sent boolean NOT NULL,
    message text NOT NULL,
    resolved boolean NOT NULL,
    type character varying(255) NOT NULL,
    CONSTRAINT system_alerts_type_check CHECK (((type)::text = ANY ((ARRAY['SYNC_FAILURE'::character varying, 'LOW_STOCK'::character varying, 'GENERAL_ERROR'::character varying])::text[])))
);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, check_in_date, check_in_time, check_out_date, created_at, payment_method, price_override_reason, room_number, room_type, status, total_cost, guest_id, processed_by_id) FROM stdin;
21eb74e9-adba-425d-9853-e4809f19f080	2026-08-17	14:00	2026-08-19	2026-08-17 09:47:08.162758+00	CASH	\N	101	Standard	CHECKED_IN	80000.00	70a8cc16-18e9-4d20-8fe8-f6a9a6f6c40f	4a533b35-6709-4dd3-aebc-b8783464432d
c8ece983-7efe-4681-8545-4ef690599c5c	2026-08-17	14:00	2026-08-18	2026-08-17 10:13:19.860008+00	POS	\N	103	Deluxe	CHECKED_IN	50000.00	a94b1c3a-59a4-4747-a66a-4d522900c518	4a533b35-6709-4dd3-aebc-b8783464432d
c5bd3f4e-19ae-4e19-a3a3-a379c05300ef	2026-08-17	14:00	2026-08-18	2026-08-17 11:37:37.849566+00	POS	\N	102	Standard	CHECKED_IN	40000.00	005cabc4-57ea-4fd5-b990-bbd2df661b07	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
9b3e7bca-6dab-4451-baf0-91b5eccbd09c	2026-08-17	14:00	2026-08-18	2026-08-17 11:45:24.433854+00	CASH	\N	104	Deluxe	CHECKED_IN	50000.00	e7f2b278-657e-42a2-8d52-1301ad24cc92	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
1c99bf57-b6e2-4da7-9d79-0dc722c251ab	2026-08-17	14:00	2026-08-18	2026-08-17 12:54:04.24206+00	CASH	\N	105	Suite	CHECKED_IN	60000.00	d0f08b7c-8495-4a37-b5f4-f482af7438ac	4a533b35-6709-4dd3-aebc-b8783464432d
07e6d483-cb43-4a4a-9bc4-b6ed7264a9ef	2026-08-17	\N	2026-08-19	2026-08-17 14:48:26.261705+00	POS	\N	106	Suite	CHECKED_IN	120000.00	d0f08b7c-8495-4a37-b5f4-f482af7438ac	4a533b35-6709-4dd3-aebc-b8783464432d
380b49d8-30fc-4419-ac79-4d8dca97d389	2026-08-17	\N	2026-08-18	2026-08-17 15:43:15.024508+00	POS	\N	107	Suite	CHECKED_IN	60000.00	d0f08b7c-8495-4a37-b5f4-f482af7438ac	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
\.


--
-- Data for Name: facility; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facility (id, address, created_at, name, timezone) FROM stdin;
e4b0a718-590e-43c5-a96d-b83e282667df	\N	2026-08-15 14:33:14.684926+00	Feni Hotel	UTC
\.


--
-- Data for Name: guests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guests (id, address, arriving_from, email, first_name, going_to, id_scan_url, last_name, lga, nationality, next_of_kin_phone, occupation, passport_no, phone, purpose_of_visit, state_of_origin, title) FROM stdin;
70a8cc16-18e9-4d20-8fe8-f6a9a6f6c40f	\N	\N	sim@gmail.com	John	\N	\N	Musa	\N	\N	\N	\N	\N	09033993399	\N	\N	\N
a94b1c3a-59a4-4747-a66a-4d522900c518	\N	\N	sim@gmail.cm	Timothy	\N	\N	Joshua	\N	\N	\N	\N	\N	0904488383	\N	\N	\N
005cabc4-57ea-4fd5-b990-bbd2df661b07	\N	\N	fa@gmail.com	Fatmu	\N	\N	Kalu	\N	\N	\N	\N	\N	9090382398	\N	\N	\N
e7f2b278-657e-42a2-8d52-1301ad24cc92	\N	\N	ho@gmail.com	holu	\N	\N	lpa	\N	\N	\N	\N	\N	030238023	\N	\N	\N
d0f08b7c-8495-4a37-b5f4-f482af7438ac	K town 5 streen	Abuja	simdimike123@gmail.com	Simon	Jos	\N	John	Panksin	Nigeria	Villong		9984094	89833884488		Plateau	
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_entries (id, created_at, entry_type, reference_id, processed_by_id) FROM stdin;
68bb3d4c-c130-4c83-9490-6605f485b4d4	2026-08-17 06:55:51.558867+00	INVENTORY_INTAKE	be9b97ba-8f43-4e91-9ffe-21a03ae1f4a7	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
9c1f9895-bb1a-4d05-b416-b9fb40cb4e81	2026-08-17 06:56:28.641293+00	INVENTORY_INTAKE	b4f3b8be-089c-494b-bd98-f27da5e17d7f	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
aa2ef5c9-62d6-4dbe-a748-57c29703e0cb	2026-08-17 07:21:56.57133+00	INVENTORY_INTAKE	3c9d61f5-ae1e-48be-a4dc-8ca0dbf71969	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
98a79f69-d68f-44d8-a8d6-c6c85e63209e	2026-08-17 07:22:05.037076+00	INVENTORY_INTAKE	d6124dde-8d15-4c43-8a4d-c7972fea5989	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
248e35ca-d0a4-4294-a229-5582e7dfbb1d	2026-08-17 07:22:17.249785+00	INVENTORY_INTAKE	830d1b9c-4737-4ace-ac87-834bee89bd94	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
d6241529-5052-4aae-8079-cf3e8d3063e5	2026-08-17 09:15:51.927548+00	SALE	4356a80b-4814-43c2-bad0-df6ae2a4f46e	4a533b35-6709-4dd3-aebc-b8783464432d
6d354559-9caa-4b09-ba43-69fb03f10676	2026-08-17 09:33:03.230724+00	SALE	4fafdbe0-8600-46e0-adf5-fc97d188ad80	4a533b35-6709-4dd3-aebc-b8783464432d
9aad7d1e-6e80-45b0-9790-ab6ea0d0de61	2026-08-17 09:36:55.264264+00	SALE	c0f1f30a-f169-415f-9b50-218c0c1e518e	4a533b35-6709-4dd3-aebc-b8783464432d
1e0c269a-f07d-4d12-85a5-3510b2c6f497	2026-08-17 09:38:16.619119+00	SALE	acf49be4-e32a-4f12-ae7b-588a279ce9d3	4a533b35-6709-4dd3-aebc-b8783464432d
f14c3423-929a-45f0-a88c-7721fa9b3473	2026-08-17 09:47:08.164316+00	BOOKING_PAYMENT	21eb74e9-adba-425d-9853-e4809f19f080	4a533b35-6709-4dd3-aebc-b8783464432d
d9e478e6-107e-4539-8508-76fb5f826beb	2026-08-17 10:13:19.862127+00	BOOKING_PAYMENT	c8ece983-7efe-4681-8545-4ef690599c5c	4a533b35-6709-4dd3-aebc-b8783464432d
2f767cd3-4d92-4a36-bd8b-558426b3869c	2026-08-17 11:25:23.874381+00	SALE	8e191597-49ef-40be-a3c1-3cf1bad20801	4a533b35-6709-4dd3-aebc-b8783464432d
71d2662c-dfbd-470a-a17c-d321c902a85c	2026-08-17 11:37:37.852155+00	BOOKING_PAYMENT	c5bd3f4e-19ae-4e19-a3a3-a379c05300ef	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
2a3fdd5c-3e74-46c1-a864-691f72a44252	2026-08-17 11:41:00.692671+00	SALE	658c7fe8-261b-42fa-89ab-0baef1644da3	4a533b35-6709-4dd3-aebc-b8783464432d
d1d145e8-598e-4b69-934b-ad9f66aa1278	2026-08-17 11:42:48.414464+00	SALE	505372a2-8860-4d43-af6d-5222b9941f00	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
4be01bc6-58b5-4327-89e0-45d5ffca720a	2026-08-17 11:44:13.76955+00	SALE	8637738d-e883-49da-8b5a-dfeb1f98405a	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
64ed7373-db38-4096-9c06-d5fcb17615ba	2026-08-17 11:45:24.442773+00	BOOKING_PAYMENT	9b3e7bca-6dab-4451-baf0-91b5eccbd09c	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
271a97dd-849d-40b0-923c-e3ebeaf51300	2026-08-17 12:52:08.625288+00	SALE	415e07c3-02dd-45f4-906e-62433746fbba	7c6c7326-436a-4322-869b-039863a5ea2f
3b1e2d4f-870b-4c7c-882c-cf8955a5d242	2026-08-17 12:52:59.482269+00	SALE	56f68cc6-96ae-4b64-8763-2fcc73a06fb8	7c6c7326-436a-4322-869b-039863a5ea2f
0b76f118-d205-4618-b36f-886e398ae954	2026-08-17 12:54:04.246718+00	BOOKING_PAYMENT	1c99bf57-b6e2-4da7-9d79-0dc722c251ab	4a533b35-6709-4dd3-aebc-b8783464432d
67564001-f96c-42e5-b9f6-373021de0ef4	2026-08-17 14:48:26.32937+00	BOOKING_PAYMENT	07e6d483-cb43-4a4a-9bc4-b6ed7264a9ef	4a533b35-6709-4dd3-aebc-b8783464432d
f7d37759-4855-4c7d-909e-319fabe6d669	2026-08-17 15:43:15.058274+00	BOOKING_PAYMENT	380b49d8-30fc-4419-ac79-4d8dca97d389	d15d5cfc-bdf6-41a0-87d2-fad01e3758ef
\.


--
-- Data for Name: journal_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.journal_lines (id, account_name, credit_amount, debit_amount, journal_entry_id) FROM stdin;
80b4e9ca-73ba-472d-894a-a199ccbddf3e	Inventory Asset	0.00	1000.00	68bb3d4c-c130-4c83-9490-6605f485b4d4
47a8b5b6-e881-43cb-8802-db7a0c3f3af8	Accounts Payable	1000.00	0.00	68bb3d4c-c130-4c83-9490-6605f485b4d4
3eeac00f-985e-45d0-9b0a-52e283f93625	Inventory Asset	0.00	4000.00	9c1f9895-bb1a-4d05-b416-b9fb40cb4e81
a8fb2566-3a0a-420a-9bcd-090437c912be	Accounts Payable	4000.00	0.00	9c1f9895-bb1a-4d05-b416-b9fb40cb4e81
39312e8b-4795-420b-ac29-bc763ce6bdd8	Inventory Asset	0.00	6000.00	aa2ef5c9-62d6-4dbe-a748-57c29703e0cb
5e4a52e3-baf5-4de8-856f-c77dd12f67d8	Accounts Payable	6000.00	0.00	aa2ef5c9-62d6-4dbe-a748-57c29703e0cb
45a6aa02-b5ab-4b2e-ab52-87c06919dafb	Inventory Asset	0.00	1500.00	98a79f69-d68f-44d8-a8d6-c6c85e63209e
15f9720b-f1b2-40c9-85b0-6461efb2df12	Accounts Payable	1500.00	0.00	98a79f69-d68f-44d8-a8d6-c6c85e63209e
846b2343-100d-44c2-ab42-22e275a42217	Inventory Asset	0.00	200.00	248e35ca-d0a4-4294-a229-5582e7dfbb1d
d7ad371a-1d46-4dc6-94ba-1c2525e6a9d7	Accounts Payable	200.00	0.00	248e35ca-d0a4-4294-a229-5582e7dfbb1d
a1a9ef3d-8f0d-4f72-9cb2-3faa8dbf57d9	Cash	0.00	9500.00	d6241529-5052-4aae-8079-cf3e8d3063e5
34ce7731-2139-4711-a775-0e3330bded92	Sales Revenue - KITCHEN	5000.00	0.00	d6241529-5052-4aae-8079-cf3e8d3063e5
b6305a19-30eb-4f77-9a53-388dfd2023ab	Sales Revenue - BAR	4500.00	0.00	d6241529-5052-4aae-8079-cf3e8d3063e5
e6eec23b-e420-4ca4-a695-f1b40bc6f50c	Cost of Goods Sold	0.00	5700.00	d6241529-5052-4aae-8079-cf3e8d3063e5
d9fdd737-0da6-44e9-bdcb-92ef28f74b5a	Inventory Asset	5700.00	0.00	d6241529-5052-4aae-8079-cf3e8d3063e5
d19b71c5-ed1d-4ba2-9edc-39931e0692c0	Cash	0.00	4500.00	6d354559-9caa-4b09-ba43-69fb03f10676
b0faefbf-d0fb-4451-b8c3-bab598b8c08b	Sales Revenue - KITCHEN	4500.00	0.00	6d354559-9caa-4b09-ba43-69fb03f10676
a9163e9f-ef08-4ba3-8e09-c33f28558d4d	Cost of Goods Sold	0.00	2500.00	6d354559-9caa-4b09-ba43-69fb03f10676
c2f0de8e-4054-4e26-8945-72cc4b0c17f7	Inventory Asset	2500.00	0.00	6d354559-9caa-4b09-ba43-69fb03f10676
951e1af9-143f-4c03-b8e5-4ab262a3616f	Cash	0.00	8000.00	9aad7d1e-6e80-45b0-9790-ab6ea0d0de61
b7ca9ce3-d153-4cee-b981-7126e456f148	Sales Revenue - KITCHEN	8000.00	0.00	9aad7d1e-6e80-45b0-9790-ab6ea0d0de61
d6b72c1d-a306-4ae4-947f-963c6f1ede17	Cost of Goods Sold	0.00	5000.00	9aad7d1e-6e80-45b0-9790-ab6ea0d0de61
4a23f7bf-1043-4e09-84e5-9a8eb999e695	Inventory Asset	5000.00	0.00	9aad7d1e-6e80-45b0-9790-ab6ea0d0de61
61bb052f-5cdb-4f51-9468-4172b21fd54f	Cash	0.00	4500.00	1e0c269a-f07d-4d12-85a5-3510b2c6f497
158ad79f-c3c1-4e64-94e6-379fd39d634f	Sales Revenue - KITCHEN	4500.00	0.00	1e0c269a-f07d-4d12-85a5-3510b2c6f497
aba013dd-baf8-494e-bad4-90dd323b18c7	Cost of Goods Sold	0.00	2500.00	1e0c269a-f07d-4d12-85a5-3510b2c6f497
3af228f1-0bdd-4639-966a-172bb386bc1f	Inventory Asset	2500.00	0.00	1e0c269a-f07d-4d12-85a5-3510b2c6f497
82fb9f2a-c981-4908-9b80-8e8177557a8a	Cash	0.00	80000.00	f14c3423-929a-45f0-a88c-7721fa9b3473
fe094236-6d3e-41a8-8035-56b25624ae80	Sales Revenue - ROOMS	80000.00	0.00	f14c3423-929a-45f0-a88c-7721fa9b3473
d3ccba1e-e00f-448d-bfb2-2d1331bec9c3	Card Payments	0.00	50000.00	d9e478e6-107e-4539-8508-76fb5f826beb
2e057a2b-5c54-47e2-b3e6-590d8631ee40	Sales Revenue - ROOMS	50000.00	0.00	d9e478e6-107e-4539-8508-76fb5f826beb
103452c7-f23f-4afd-a22e-67860d29276d	Cash	0.00	2500.00	2f767cd3-4d92-4a36-bd8b-558426b3869c
199fb506-e5cb-4532-961e-91a43c3b91c5	Sales Revenue - BAR	2500.00	0.00	2f767cd3-4d92-4a36-bd8b-558426b3869c
b67cc907-7af9-4d47-8c74-78b113cf27e5	Cost of Goods Sold	0.00	1500.00	2f767cd3-4d92-4a36-bd8b-558426b3869c
22e6b251-688f-43f0-88df-3f5b2f1e4cb9	Inventory Asset	1500.00	0.00	2f767cd3-4d92-4a36-bd8b-558426b3869c
d1e7c713-39a0-49f8-b957-f8d6cab60ab8	Card Payments	0.00	40000.00	71d2662c-dfbd-470a-a17c-d321c902a85c
35ebdfe2-47a4-42be-ac64-e8934317815d	Sales Revenue - ROOMS	40000.00	0.00	71d2662c-dfbd-470a-a17c-d321c902a85c
c21e4113-e5c9-4227-a32b-d9a2b54719dc	Cash	0.00	3000.00	2a3fdd5c-3e74-46c1-a864-691f72a44252
37302782-0369-42cc-b43d-b3280e90d854	Sales Revenue - BAR	3000.00	0.00	2a3fdd5c-3e74-46c1-a864-691f72a44252
9aee7a51-1179-4e1d-8358-6aa609a81774	Cost of Goods Sold	0.00	1600.00	2a3fdd5c-3e74-46c1-a864-691f72a44252
6111fe22-4390-4829-93c7-96187144051d	Inventory Asset	1600.00	0.00	2a3fdd5c-3e74-46c1-a864-691f72a44252
887443df-234c-48c4-9ba6-345f8c97592b	Bank Transfers	0.00	4500.00	d1d145e8-598e-4b69-934b-ad9f66aa1278
2f7a89d6-8390-4713-8c22-bce2fe0313ae	Sales Revenue - BAR	4500.00	0.00	d1d145e8-598e-4b69-934b-ad9f66aa1278
3cc0207d-6027-4e9e-b99a-db3e05763656	Cost of Goods Sold	0.00	3000.00	d1d145e8-598e-4b69-934b-ad9f66aa1278
66e3c85c-b6a9-4ca7-804e-38c041de9fc7	Inventory Asset	3000.00	0.00	d1d145e8-598e-4b69-934b-ad9f66aa1278
8eb889d1-2889-4f1d-88c5-747bd7d45f8e	Bank Transfers	0.00	55500.00	4be01bc6-58b5-4327-89e0-45d5ffca720a
35b63c44-4e92-4ee5-a825-bfe175f57e7c	Sales Revenue - KITCHEN	44000.00	0.00	4be01bc6-58b5-4327-89e0-45d5ffca720a
2d9ffbd5-aaac-4bc6-b7ea-09904734e596	Sales Revenue - BAR	11500.00	0.00	4be01bc6-58b5-4327-89e0-45d5ffca720a
3bf7f871-b168-4673-8297-22b879b00a7f	Cost of Goods Sold	0.00	33900.00	4be01bc6-58b5-4327-89e0-45d5ffca720a
725c43dd-e495-4519-8988-df47aa106d07	Inventory Asset	33900.00	0.00	4be01bc6-58b5-4327-89e0-45d5ffca720a
5d028450-4190-445d-a8b7-f9e654bba3da	Cash	0.00	50000.00	64ed7373-db38-4096-9c06-d5fcb17615ba
67f22441-e575-459c-9d7f-a851face5406	Sales Revenue - ROOMS	50000.00	0.00	64ed7373-db38-4096-9c06-d5fcb17615ba
c4f85e3f-a614-410f-9529-b21b40964cce	Cash	0.00	2500.00	271a97dd-849d-40b0-923c-e3ebeaf51300
c3eee027-0a8f-40bf-8392-5587950233b5	Sales Revenue - BAR	2500.00	0.00	271a97dd-849d-40b0-923c-e3ebeaf51300
1283ab25-96c2-4f0d-a0d3-9b6c750eef1d	Cost of Goods Sold	0.00	1500.00	271a97dd-849d-40b0-923c-e3ebeaf51300
1b059d1b-c4cc-45ae-b849-511909aebc0c	Inventory Asset	1500.00	0.00	271a97dd-849d-40b0-923c-e3ebeaf51300
f85eb61f-509e-4367-aa0b-190e3dcf07b9	Cash	0.00	14000.00	3b1e2d4f-870b-4c7c-882c-cf8955a5d242
2f3ab12f-9048-423d-8f9e-8be57841755e	Sales Revenue - KITCHEN	14000.00	0.00	3b1e2d4f-870b-4c7c-882c-cf8955a5d242
3d3e6e31-d9d3-4879-8e8b-acca63e321c0	Cost of Goods Sold	0.00	8400.00	3b1e2d4f-870b-4c7c-882c-cf8955a5d242
b36f2bbf-6c44-4bd2-bf94-064f1d6d9eb6	Inventory Asset	8400.00	0.00	3b1e2d4f-870b-4c7c-882c-cf8955a5d242
f5e9e893-53bf-4313-8671-60731ac1a762	Cash	0.00	60000.00	0b76f118-d205-4618-b36f-886e398ae954
08a6c5ea-b1dc-495b-8664-aa16f0a6eee2	Sales Revenue - ROOMS	60000.00	0.00	0b76f118-d205-4618-b36f-886e398ae954
fd77ca71-18ab-4218-af48-b5136ab52e7e	Card Payments	0.00	120000.00	67564001-f96c-42e5-b9f6-373021de0ef4
3707b72e-f494-4d05-a8d0-a21ccfe27f81	Sales Revenue - ROOMS	120000.00	0.00	67564001-f96c-42e5-b9f6-373021de0ef4
26f60d7e-26ca-4b2f-a003-1d8b6bbfa2d1	Card Payments	0.00	60000.00	f7d37759-4855-4c7d-909e-319fabe6d669
3a488a1e-7052-4f96-be2c-c943e0a055a7	Sales Revenue - ROOMS	60000.00	0.00	f7d37759-4855-4c7d-909e-319fabe6d669
\.


--
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbox_events (id, created_at, event_type, payload, retry_count, status, synced_at) FROM stdin;
ddd4ad86-475f-4c6e-a296-498d31e2d083	2026-08-17 07:21:56.582742+00	INVENTORY_RECEIVED	{"referenceId":"3c9d61f5-ae1e-48be-a4dc-8ca0dbf71969", "totalValue":6000.00}	101	FAILED	\N
108ab5ea-4127-473d-bf50-4545df98986e	2026-08-17 07:22:05.041185+00	INVENTORY_RECEIVED	{"referenceId":"d6124dde-8d15-4c43-8a4d-c7972fea5989", "totalValue":1500.00}	101	FAILED	\N
9443e228-3498-4f5f-85e0-cc2184269358	2026-08-17 07:22:17.253654+00	INVENTORY_RECEIVED	{"referenceId":"830d1b9c-4737-4ace-ac87-834bee89bd94", "totalValue":200.00}	101	FAILED	\N
30d3d009-60c0-4597-8d28-88950c3ad5b4	2026-08-17 06:55:51.589279+00	INVENTORY_RECEIVED	{"referenceId":"be9b97ba-8f43-4e91-9ffe-21a03ae1f4a7", "totalValue":1000.00}	101	FAILED	\N
97035357-e970-47ef-9b6f-d1e2eabcc06d	2026-08-17 06:56:28.645775+00	INVENTORY_RECEIVED	{"referenceId":"b4f3b8be-089c-494b-bd98-f27da5e17d7f", "totalValue":4000.00}	101	FAILED	\N
67e7c2c2-7cf3-4825-9d02-ab63a79901f8	2026-08-17 09:36:55.273217+00	SALE_COMPLETED	{"journalEntry":{"id":"9aad7d1e-6e80-45b0-9790-ab6ea0d0de61","entryType":"SALE","referenceId":"c0f1f30a-f169-415f-9b50-218c0c1e518e","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"951e1af9-143f-4c03-b8e5-4ab262a3616f","accountName":"Cash","debitAmount":8000.00,"creditAmount":0},{"id":"b7ca9ce3-d153-4cee-b981-7126e456f148","accountName":"Sales Revenue - KITCHEN","debitAmount":0,"creditAmount":8000.00},{"id":"d6b72c1d-a306-4ae4-947f-963c6f1ede17","accountName":"Cost of Goods Sold","debitAmount":5000.00,"creditAmount":0},{"id":"4a23f7bf-1043-4e09-84e5-9a8eb999e695","accountName":"Inventory Asset","debitAmount":0,"creditAmount":5000.00}]},"updatedProducts":[{"id":"cecd5dcf-ecca-4c94-a2fb-b762bd246f00","name":"Grilled Fish","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K004","stockQty":null,"lowStockThreshold":null,"price":8000.00,"unitCost":5000.00}],"totalRevenue":8000.00,"referenceId":"c0f1f30a-f169-415f-9b50-218c0c1e518e"}	0	SYNCED	2026-08-17 09:37:00.218981+00
54c5eb35-f2b4-4e5a-8fde-fe4f48edec38	2026-08-17 09:33:03.303756+00	SALE_COMPLETED	{"journalEntry":{"id":"6d354559-9caa-4b09-ba43-69fb03f10676","entryType":"SALE","referenceId":"4fafdbe0-8600-46e0-adf5-fc97d188ad80","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"d19b71c5-ed1d-4ba2-9edc-39931e0692c0","accountName":"Cash","debitAmount":4500.00,"creditAmount":0},{"id":"b0faefbf-d0fb-4451-b8c3-bab598b8c08b","accountName":"Sales Revenue - KITCHEN","debitAmount":0,"creditAmount":4500.00},{"id":"a9163e9f-ef08-4ba3-8e09-c33f28558d4d","accountName":"Cost of Goods Sold","debitAmount":2500.00,"creditAmount":0},{"id":"c2f0de8e-4054-4e26-8945-72cc4b0c17f7","accountName":"Inventory Asset","debitAmount":0,"creditAmount":2500.00}]},"updatedProducts":[{"id":"874dff89-1137-41a4-bec7-dd1dab8e1ccb","name":"Jollof Rice & Chicken","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K001","stockQty":null,"lowStockThreshold":null,"price":4500.00,"unitCost":2500.00}],"totalRevenue":4500.00,"referenceId":"4fafdbe0-8600-46e0-adf5-fc97d188ad80"}	42	SYNCED	2026-08-17 09:36:45.055483+00
091ed65b-bc35-4d16-8fb1-a131729b5dbd	2026-08-17 09:15:51.940729+00	SALE_COMPLETED	{"journalEntry":{"id":"d6241529-5052-4aae-8079-cf3e8d3063e5","entryType":"SALE","referenceId":"4356a80b-4814-43c2-bad0-df6ae2a4f46e","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"a1a9ef3d-8f0d-4f72-9cb2-3faa8dbf57d9","accountName":"Cash","debitAmount":9500.00,"creditAmount":0},{"id":"34ce7731-2139-4711-a775-0e3330bded92","accountName":"Sales Revenue - KITCHEN","debitAmount":0,"creditAmount":5000.00},{"id":"b6305a19-30eb-4f77-9a53-388dfd2023ab","accountName":"Sales Revenue - BAR","debitAmount":0,"creditAmount":4500.00},{"id":"e6eec23b-e420-4ca4-a695-f1b40bc6f50c","accountName":"Cost of Goods Sold","debitAmount":5700.00,"creditAmount":0},{"id":"d9fdd737-0da6-44e9-bdcb-92ef28f74b5a","accountName":"Inventory Asset","debitAmount":0,"creditAmount":5700.00}]},"updatedProducts":[{"id":"af906457-b0ec-4200-b038-ea70ef94ae04","name":"Red Bull","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B004","stockQty":5,"lowStockThreshold":null,"price":2500.00,"unitCost":1500.00},{"id":"34393f4a-d749-4fc5-ae9d-c67803c03091","name":"Starbeer Bottle","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B001","stockQty":50,"lowStockThreshold":47,"price":1500.00,"unitCost":1000.00},{"id":"f442029f-8f7d-4ee6-98b6-eb0f6496b43d","name":"Egusi Soup & Pounded Yam","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K002","stockQty":null,"lowStockThreshold":null,"price":5000.00,"unitCost":3000.00},{"id":"fc203b29-1126-4752-b176-4eb42f75d382","name":"Water (Bottle)","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B003","stockQty":106,"lowStockThreshold":null,"price":500.00,"unitCost":200.00}],"totalRevenue":9500.00,"referenceId":"4356a80b-4814-43c2-bad0-df6ae2a4f46e"}	101	FAILED	\N
92d6d672-635b-41ed-b21b-8f95a3f1895e	2026-08-17 09:38:16.622827+00	SALE_COMPLETED	{"journalEntry":{"id":"1e0c269a-f07d-4d12-85a5-3510b2c6f497","entryType":"SALE","referenceId":"acf49be4-e32a-4f12-ae7b-588a279ce9d3","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"61bb052f-5cdb-4f51-9468-4172b21fd54f","accountName":"Cash","debitAmount":4500.00,"creditAmount":0},{"id":"158ad79f-c3c1-4e64-94e6-379fd39d634f","accountName":"Sales Revenue - KITCHEN","debitAmount":0,"creditAmount":4500.00},{"id":"aba013dd-baf8-494e-bad4-90dd323b18c7","accountName":"Cost of Goods Sold","debitAmount":2500.00,"creditAmount":0},{"id":"3af228f1-0bdd-4639-966a-172bb386bc1f","accountName":"Inventory Asset","debitAmount":0,"creditAmount":2500.00}]},"updatedProducts":[{"id":"874dff89-1137-41a4-bec7-dd1dab8e1ccb","name":"Jollof Rice & Chicken","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K001","stockQty":null,"lowStockThreshold":null,"price":4500.00,"unitCost":2500.00}],"totalRevenue":4500.00,"referenceId":"acf49be4-e32a-4f12-ae7b-588a279ce9d3"}	0	SYNCED	2026-08-17 09:38:20.446993+00
7cb3655d-d097-4767-84f4-5b994d0a9eac	2026-08-17 09:47:08.166564+00	BOOKING_CREATED	{"bookingId":"21eb74e9-adba-425d-9853-e4809f19f080", "totalCost":80000}	0	SYNCED	2026-08-17 09:47:11.176641+00
09b3bc44-9ca7-4974-a0ba-a2e2b3c675d5	2026-08-17 10:13:19.865324+00	BOOKING_CREATED	{"bookingId":"c8ece983-7efe-4681-8545-4ef690599c5c", "totalCost":50000}	0	SYNCED	2026-08-17 10:13:22.742939+00
39c0aaa3-0539-474b-ba42-3fedbaf92de3	2026-08-17 11:37:37.85556+00	BOOKING_CREATED	{"bookingId":"c5bd3f4e-19ae-4e19-a3a3-a379c05300ef", "totalCost":40000}	0	SYNCED	2026-08-17 11:37:41.720173+00
ab65b22f-ea80-4fb6-b1b1-21dcc5a3d98f	2026-08-17 11:41:00.706073+00	SALE_COMPLETED	{"journalEntry":{"id":"2a3fdd5c-3e74-46c1-a864-691f72a44252","entryType":"SALE","referenceId":"658c7fe8-261b-42fa-89ab-0baef1644da3","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"c21e4113-e5c9-4227-a32b-d9a2b54719dc","accountName":"Cash","debitAmount":3000.00,"creditAmount":0},{"id":"37302782-0369-42cc-b43d-b3280e90d854","accountName":"Sales Revenue - BAR","debitAmount":0,"creditAmount":3000.00},{"id":"9aee7a51-1179-4e1d-8358-6aa609a81774","accountName":"Cost of Goods Sold","debitAmount":1600.00,"creditAmount":0},{"id":"6111fe22-4390-4829-93c7-96187144051d","accountName":"Inventory Asset","debitAmount":0,"creditAmount":1600.00}]},"updatedProducts":[{"id":"fc203b29-1126-4752-b176-4eb42f75d382","name":"Water (Bottle)","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B003","stockQty":103,"lowStockThreshold":null,"price":500.00,"unitCost":200.00},{"id":"34393f4a-d749-4fc5-ae9d-c67803c03091","name":"Starbeer Bottle","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B001","stockQty":49,"lowStockThreshold":47,"price":1500.00,"unitCost":1000.00}],"totalRevenue":3000.00,"referenceId":"658c7fe8-261b-42fa-89ab-0baef1644da3"}	0	SYNCED	2026-08-17 11:41:02.147957+00
40f89257-29e8-425c-b878-b179d0907437	2026-08-17 11:25:23.893277+00	SALE_COMPLETED	{"journalEntry":{"id":"2f767cd3-4d92-4a36-bd8b-558426b3869c","entryType":"SALE","referenceId":"8e191597-49ef-40be-a3c1-3cf1bad20801","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"103452c7-f23f-4afd-a22e-67860d29276d","accountName":"Cash","debitAmount":2500.00,"creditAmount":0},{"id":"199fb506-e5cb-4532-961e-91a43c3b91c5","accountName":"Sales Revenue - BAR","debitAmount":0,"creditAmount":2500.00},{"id":"b67cc907-7af9-4d47-8c74-78b113cf27e5","accountName":"Cost of Goods Sold","debitAmount":1500.00,"creditAmount":0},{"id":"22e6b251-688f-43f0-88df-3f5b2f1e4cb9","accountName":"Inventory Asset","debitAmount":0,"creditAmount":1500.00}]},"updatedProducts":[{"id":"af906457-b0ec-4200-b038-ea70ef94ae04","name":"Red Bull","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B004","stockQty":4,"lowStockThreshold":null,"price":2500.00,"unitCost":1500.00}],"totalRevenue":2500.00,"referenceId":"8e191597-49ef-40be-a3c1-3cf1bad20801"}	25	SYNCED	2026-08-17 11:27:35.978551+00
0bf47cfb-fedd-4d4c-bad8-1de9ceb1134a	2026-08-17 11:42:48.439932+00	SALE_COMPLETED	{"journalEntry":{"id":"d1d145e8-598e-4b69-934b-ad9f66aa1278","entryType":"SALE","referenceId":"505372a2-8860-4d43-af6d-5222b9941f00","processedBy":{"id":"d15d5cfc-bdf6-41a0-87d2-fad01e3758ef","mustChangePassword":false,"username":"admin","passwordHash":"$2a$10$9Y6uGmi1ItF7.ume.LdsBe40Nck52U9mlWCqtZYuWMica9k0fb9lm","role":"ADMIN","active":true},"createdAt":null,"lines":[{"id":"887443df-234c-48c4-9ba6-345f8c97592b","accountName":"Bank Transfers","debitAmount":4500.00,"creditAmount":0},{"id":"2f7a89d6-8390-4713-8c22-bce2fe0313ae","accountName":"Sales Revenue - BAR","debitAmount":0,"creditAmount":4500.00},{"id":"3cc0207d-6027-4e9e-b99a-db3e05763656","accountName":"Cost of Goods Sold","debitAmount":3000.00,"creditAmount":0},{"id":"66e3c85c-b6a9-4ca7-804e-38c041de9fc7","accountName":"Inventory Asset","debitAmount":0,"creditAmount":3000.00}]},"updatedProducts":[{"id":"34393f4a-d749-4fc5-ae9d-c67803c03091","name":"Starbeer Bottle","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B001","stockQty":46,"lowStockThreshold":47,"price":1500.00,"unitCost":1000.00}],"totalRevenue":4500.00,"referenceId":"505372a2-8860-4d43-af6d-5222b9941f00"}	0	SYNCED	2026-08-17 11:42:52.495423+00
152de393-a593-4872-a341-3cdb44f58248	2026-08-17 11:44:13.789217+00	SALE_COMPLETED	{"journalEntry":{"id":"4be01bc6-58b5-4327-89e0-45d5ffca720a","entryType":"SALE","referenceId":"8637738d-e883-49da-8b5a-dfeb1f98405a","processedBy":{"id":"d15d5cfc-bdf6-41a0-87d2-fad01e3758ef","mustChangePassword":false,"username":"admin","passwordHash":"$2a$10$9Y6uGmi1ItF7.ume.LdsBe40Nck52U9mlWCqtZYuWMica9k0fb9lm","role":"ADMIN","active":true},"createdAt":null,"lines":[{"id":"8eb889d1-2889-4f1d-88c5-747bd7d45f8e","accountName":"Bank Transfers","debitAmount":55500.00,"creditAmount":0},{"id":"35b63c44-4e92-4ee5-a825-bfe175f57e7c","accountName":"Sales Revenue - KITCHEN","debitAmount":0,"creditAmount":44000.00},{"id":"2d9ffbd5-aaac-4bc6-b7ea-09904734e596","accountName":"Sales Revenue - BAR","debitAmount":0,"creditAmount":11500.00},{"id":"3bf7f871-b168-4673-8297-22b879b00a7f","accountName":"Cost of Goods Sold","debitAmount":33900.00,"creditAmount":0},{"id":"725c43dd-e495-4519-8988-df47aa106d07","accountName":"Inventory Asset","debitAmount":0,"creditAmount":33900.00}]},"updatedProducts":[{"id":"f442029f-8f7d-4ee6-98b6-eb0f6496b43d","name":"Egusi Soup & Pounded Yam","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K002","stockQty":null,"lowStockThreshold":null,"price":5000.00,"unitCost":3000.00},{"id":"af906457-b0ec-4200-b038-ea70ef94ae04","name":"Red Bull","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B004","stockQty":1,"lowStockThreshold":null,"price":2500.00,"unitCost":1500.00},{"id":"dffd5a99-6f44-43dd-880e-f05b4cfc22cc","name":"Guinness Stout","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B002","stockQty":34,"lowStockThreshold":null,"price":2000.00,"unitCost":1200.00},{"id":"cecd5dcf-ecca-4c94-a2fb-b762bd246f00","name":"Grilled Fish","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K004","stockQty":null,"lowStockThreshold":null,"price":8000.00,"unitCost":5000.00}],"totalRevenue":55500.00,"referenceId":"8637738d-e883-49da-8b5a-dfeb1f98405a"}	0	SYNCED	2026-08-17 11:44:17.93666+00
2a735d9f-7af9-430a-9943-e9d0ac9c76b7	2026-08-17 11:45:24.451001+00	BOOKING_CREATED	{"bookingId":"9b3e7bca-6dab-4451-baf0-91b5eccbd09c", "totalCost":50000}	0	SYNCED	2026-08-17 11:45:28.066443+00
6510f172-53cf-4d63-a5d4-4281b123f4a7	2026-08-17 12:52:08.667007+00	SALE_COMPLETED	{"journalEntry":{"id":"271a97dd-849d-40b0-923c-e3ebeaf51300","entryType":"SALE","referenceId":"415e07c3-02dd-45f4-906e-62433746fbba","processedBy":{"id":"7c6c7326-436a-4322-869b-039863a5ea2f","mustChangePassword":false,"username":"mercy","passwordHash":"$2a$10$WrYi64hzlAahcQbyW4lLK.nJcGb3QucBQbNsB5aLLDmcNA5qYM1NK","role":"BARTENDER","active":true},"createdAt":null,"lines":[{"id":"c4f85e3f-a614-410f-9529-b21b40964cce","accountName":"Cash","debitAmount":2500.00,"creditAmount":0},{"id":"c3eee027-0a8f-40bf-8392-5587950233b5","accountName":"Sales Revenue - BAR","debitAmount":0,"creditAmount":2500.00},{"id":"1283ab25-96c2-4f0d-a0d3-9b6c750eef1d","accountName":"Cost of Goods Sold","debitAmount":1500.00,"creditAmount":0},{"id":"1b059d1b-c4cc-45ae-b849-511909aebc0c","accountName":"Inventory Asset","debitAmount":0,"creditAmount":1500.00}]},"updatedProducts":[{"id":"af906457-b0ec-4200-b038-ea70ef94ae04","name":"Red Bull","type":"RAW_GOOD","revenueCenter":"BAR","manufacturerBarcode":null,"internalSku":"B004","stockQty":0,"lowStockThreshold":null,"price":2500.00,"unitCost":1500.00}],"totalRevenue":2500.00,"referenceId":"415e07c3-02dd-45f4-906e-62433746fbba"}	0	SYNCED	2026-08-17 12:52:11.972423+00
020f1590-42f7-43d8-977b-a92e2d11cf80	2026-08-17 12:54:04.250942+00	BOOKING_CREATED	{"journalEntry":{"id":"0b76f118-d205-4618-b36f-886e398ae954","entryType":"BOOKING_PAYMENT","referenceId":"1c99bf57-b6e2-4da7-9d79-0dc722c251ab","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"f5e9e893-53bf-4313-8671-60731ac1a762","accountName":"Cash","debitAmount":60000,"creditAmount":0},{"id":"08a6c5ea-b1dc-495b-8664-aa16f0a6eee2","accountName":"Sales Revenue - ROOMS","debitAmount":0,"creditAmount":60000}]},"booking":{"id":"1c99bf57-b6e2-4da7-9d79-0dc722c251ab","processedBy":{"username":"mary"},"totalCost":60000}}	0	SYNCED	2026-08-17 12:54:07.717573+00
8b6d9289-d096-44e5-b7fd-a8f52b780cd1	2026-08-17 12:52:59.504325+00	SALE_COMPLETED	{"journalEntry":{"id":"3b1e2d4f-870b-4c7c-882c-cf8955a5d242","entryType":"SALE","referenceId":"56f68cc6-96ae-4b64-8763-2fcc73a06fb8","processedBy":{"id":"7c6c7326-436a-4322-869b-039863a5ea2f","mustChangePassword":false,"username":"mercy","passwordHash":"$2a$10$WrYi64hzlAahcQbyW4lLK.nJcGb3QucBQbNsB5aLLDmcNA5qYM1NK","role":"BARTENDER","active":true},"createdAt":null,"lines":[{"id":"f85eb61f-509e-4367-aa0b-190e3dcf07b9","accountName":"Cash","debitAmount":14000.00,"creditAmount":0},{"id":"2f3ab12f-9048-423d-8f9e-8be57841755e","accountName":"Sales Revenue - KITCHEN","debitAmount":0,"creditAmount":14000.00},{"id":"3d3e6e31-d9d3-4879-8e8b-acca63e321c0","accountName":"Cost of Goods Sold","debitAmount":8400.00,"creditAmount":0},{"id":"b36f2bbf-6c44-4bd2-bf94-064f1d6d9eb6","accountName":"Inventory Asset","debitAmount":0,"creditAmount":8400.00}]},"updatedProducts":[{"id":"cecd5dcf-ecca-4c94-a2fb-b762bd246f00","name":"Grilled Fish","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K004","stockQty":null,"lowStockThreshold":null,"price":8000.00,"unitCost":5000.00},{"id":"aadd2875-f208-4dee-8b3b-361341b88e79","name":"Plantain (Extra)","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K003","stockQty":null,"lowStockThreshold":null,"price":1000.00,"unitCost":400.00},{"id":"f442029f-8f7d-4ee6-98b6-eb0f6496b43d","name":"Egusi Soup & Pounded Yam","type":"PREPARED_DISH","revenueCenter":"KITCHEN","manufacturerBarcode":null,"internalSku":"K002","stockQty":null,"lowStockThreshold":null,"price":5000.00,"unitCost":3000.00}],"totalRevenue":14000.00,"referenceId":"56f68cc6-96ae-4b64-8763-2fcc73a06fb8"}	0	SYNCED	2026-08-17 12:53:02.375048+00
417b4a89-39cf-4a4d-80bb-7fd182ea3f00	2026-08-17 14:48:26.348782+00	BOOKING_CREATED	{"journalEntry":{"id":"67564001-f96c-42e5-b9f6-373021de0ef4","entryType":"BOOKING_PAYMENT","referenceId":"07e6d483-cb43-4a4a-9bc4-b6ed7264a9ef","processedBy":{"id":"4a533b35-6709-4dd3-aebc-b8783464432d","mustChangePassword":false,"username":"mary","passwordHash":"$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy","role":"FRONT_DESK","active":true},"createdAt":null,"lines":[{"id":"fd77ca71-18ab-4218-af48-b5136ab52e7e","accountName":"Card Payments","debitAmount":120000,"creditAmount":0},{"id":"3707b72e-f494-4d05-a8d0-a21ccfe27f81","accountName":"Sales Revenue - ROOMS","debitAmount":0,"creditAmount":120000}]},"booking":{"id":"07e6d483-cb43-4a4a-9bc4-b6ed7264a9ef","processedBy":{"username":"mary"},"totalCost":120000}}	0	SYNCED	2026-08-17 14:48:29.148287+00
c4db0a23-691e-41e0-8054-4f0c09c97534	2026-08-17 15:43:15.065259+00	BOOKING_CREATED	{"journalEntry":{"id":"f7d37759-4855-4c7d-909e-319fabe6d669","entryType":"BOOKING_PAYMENT","referenceId":"380b49d8-30fc-4419-ac79-4d8dca97d389","processedBy":{"id":"d15d5cfc-bdf6-41a0-87d2-fad01e3758ef","mustChangePassword":false,"username":"admin","passwordHash":"$2a$10$9Y6uGmi1ItF7.ume.LdsBe40Nck52U9mlWCqtZYuWMica9k0fb9lm","role":"ADMIN","active":true},"createdAt":null,"lines":[{"id":"26f60d7e-26ca-4b2f-a003-1d8b6bbfa2d1","accountName":"Card Payments","debitAmount":60000,"creditAmount":0},{"id":"3a488a1e-7052-4f96-be2c-c943e0a055a7","accountName":"Sales Revenue - ROOMS","debitAmount":0,"creditAmount":60000}]},"booking":{"id":"380b49d8-30fc-4419-ac79-4d8dca97d389","processedBy":{"username":"admin"},"totalCost":60000}}	0	SYNCED	2026-08-17 15:43:19.860424+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, internal_sku, low_stock_threshold, manufacturer_barcode, name, price, revenue_center, stock_qty, type, unit_cost) FROM stdin;
874dff89-1137-41a4-bec7-dd1dab8e1ccb	K001	\N	\N	Jollof Rice & Chicken	4500.00	KITCHEN	\N	PREPARED_DISH	2500.00
f442029f-8f7d-4ee6-98b6-eb0f6496b43d	K002	\N	\N	Egusi Soup & Pounded Yam	5000.00	KITCHEN	\N	PREPARED_DISH	3000.00
aadd2875-f208-4dee-8b3b-361341b88e79	K003	\N	\N	Plantain (Extra)	1000.00	KITCHEN	\N	PREPARED_DISH	400.00
cecd5dcf-ecca-4c94-a2fb-b762bd246f00	K004	\N	\N	Grilled Fish	8000.00	KITCHEN	\N	PREPARED_DISH	5000.00
fc203b29-1126-4752-b176-4eb42f75d382	B003	\N	\N	Water (Bottle)	500.00	BAR	103	RAW_GOOD	200.00
34393f4a-d749-4fc5-ae9d-c67803c03091	B001	47	\N	Starbeer Bottle	1500.00	BAR	46	RAW_GOOD	1000.00
dffd5a99-6f44-43dd-880e-f05b4cfc22cc	B002	\N	\N	Guinness Stout	2000.00	BAR	34	RAW_GOOD	1200.00
af906457-b0ec-4200-b038-ea70ef94ae04	B004	\N	\N	Red Bull	2500.00	BAR	0	RAW_GOOD	1500.00
\.


--
-- Data for Name: promo_campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_campaigns (id, created_at, discount_percentage, end_date, is_active, name, start_date, target_room_type, updated_at) FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, active, base_price, created_at, room_number, room_type, status, updated_at) FROM stdin;
d2f6b3b0-2901-4137-afdd-f52ca79dea35	t	40000.00	2026-08-17 09:42:40.727284+00	101	Standard	OCCUPIED	2026-08-17 09:47:08.167221+00
93faf3a2-b2b4-4faf-943f-665319c2dc58	t	50000.00	2026-08-17 09:43:28.663648+00	103	Deluxe	OCCUPIED	2026-08-17 10:13:19.866+00
ae7654d1-6d1c-4708-851f-6da783ece3a4	t	40000.00	2026-08-17 09:42:59.330739+00	102	Standard	OCCUPIED	2026-08-17 11:37:37.860888+00
55ccb825-d655-4846-8574-4328344f5b8f	t	50000.00	2026-08-17 09:44:43.23598+00	104	Deluxe	OCCUPIED	2026-08-17 11:45:24.454095+00
6d56a57d-9ae1-447c-a866-1a19bd6cddb3	t	60000.00	2026-08-17 09:44:58.818474+00	105	Suite	OCCUPIED	2026-08-17 12:54:04.253243+00
47132206-3cdb-4df2-8cb6-3df668ff08c9	t	60000.00	2026-08-17 09:45:15.055142+00	106	Suite	OCCUPIED	2026-08-17 14:48:26.363372+00
a0d028f3-9096-4b66-98d3-a69401441867	t	60000.00	2026-08-17 15:27:52.407568+00	108	Suite	AVAILABLE	2026-08-17 15:27:52.407613+00
8a2f81b8-51b8-4b13-ac38-aa03b9affc1c	t	60000.00	2026-08-17 15:27:26.689806+00	107	Suite	OCCUPIED	2026-08-17 15:43:15.0683+00
\.


--
-- Data for Name: staff_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_users (id, active, must_change_password, password_hash, role, username) FROM stdin;
d15d5cfc-bdf6-41a0-87d2-fad01e3758ef	t	f	$2a$10$9Y6uGmi1ItF7.ume.LdsBe40Nck52U9mlWCqtZYuWMica9k0fb9lm	ADMIN	admin
4a533b35-6709-4dd3-aebc-b8783464432d	t	f	$2a$10$XjkuODT5WDjjBcKxGxy6A.6QbQE7thEbn7Xke3X05W9vsH87UBXyy	FRONT_DESK	mary
7c6c7326-436a-4322-869b-039863a5ea2f	t	f	$2a$10$WrYi64hzlAahcQbyW4lLK.nJcGb3QucBQbNsB5aLLDmcNA5qYM1NK	BARTENDER	mercy
\.


--
-- Data for Name: system_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_alerts (id, created_at, email_sent, message, resolved, type) FROM stdin;
2494d65d-ff23-433f-a8ac-2e4c8f793556	2026-08-17 07:04:21.575093+00	t	The local facility server has been unable to sync data to the cloud for over 100 consecutive attempts. Please investigate network connectivity or cloud service health immediately.	f	SYNC_FAILURE
\.


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: facility facility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facility
    ADD CONSTRAINT facility_pkey PRIMARY KEY (id);


--
-- Name: guests guests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_lines journal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promo_campaigns promo_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_campaigns
    ADD CONSTRAINT promo_campaigns_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: staff_users staff_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_users
    ADD CONSTRAINT staff_users_pkey PRIMARY KEY (id);


--
-- Name: system_alerts system_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_alerts
    ADD CONSTRAINT system_alerts_pkey PRIMARY KEY (id);


--
-- Name: products uk6haje5m8wusvuevg599ovcnpl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uk6haje5m8wusvuevg599ovcnpl UNIQUE (manufacturer_barcode);


--
-- Name: rooms uk7ljglxlj90ln3lbas4kl983m2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT uk7ljglxlj90ln3lbas4kl983m2 UNIQUE (room_number);


--
-- Name: staff_users uk84ntv1iab9fa9byg67plxw9fb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_users
    ADD CONSTRAINT uk84ntv1iab9fa9byg67plxw9fb UNIQUE (username);


--
-- Name: products ukrh7xkir4eucxp7o8djc64q15t; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT ukrh7xkir4eucxp7o8djc64q15t UNIQUE (internal_sku);


--
-- Name: journal_lines fk1mucajfkxo6i8ldmy61xsaf85; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT fk1mucajfkxo6i8ldmy61xsaf85 FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id);


--
-- Name: bookings fkfbuugplswvh4n0nvsgmlja42g; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fkfbuugplswvh4n0nvsgmlja42g FOREIGN KEY (processed_by_id) REFERENCES public.staff_users(id);


--
-- Name: journal_entries fkgc8j4gasib6afb4jt01g7afya; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT fkgc8j4gasib6afb4jt01g7afya FOREIGN KEY (processed_by_id) REFERENCES public.staff_users(id);


--
-- Name: bookings fkpvlyfwhomknrbmo2d20src5vi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fkpvlyfwhomknrbmo2d20src5vi FOREIGN KEY (guest_id) REFERENCES public.guests(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6b1Aad5cQYkoKVcV3G4H8vFyeiG9s41A9XVvmrGYfcND0cU0STLemGZtiI7nVIy

