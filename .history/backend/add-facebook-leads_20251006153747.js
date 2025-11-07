
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import Lead from './models/Lead.js';
import User from './models/User.js';
import Organization from './models/Organization.js';

dotenv.config();

// Facebook leads data provided by user
const FACEBOOK_LEADS_DATA = `id	created_time	ad_id	ad_name	adset_id	adset_name	campaign_id	campaign_name	form_id	form_name	is_organic	platform	full_name	phone_number	work_email	city	inbox_url	lead_status
l:4280180252203503	2025-09-12T15:05:13+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Akshay Sinha	p:+447879433123	Aks@blupacetech.com	London		complete
l:582128261560337	2025-09-12T13:57:00+05:30	ag:120232362357810199	get_international	as:120232362357840199	int_based	c:120232362357820199	leadgen_dba_uk_meritshot	f:2013930249374081	leadgen_dba_meritshot_uk	FALSE	ig	Chimzurum Onyeoma	p:07405263058	Chimzurum.Onyeoma@zimidentity.net	London		complete



