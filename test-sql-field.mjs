import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(URL, KEY);

// We simulate DDL via RPC if possible, but actually Supabase clients can't easily alter tables via ANON.
// Given we might not have RPC or Service Role, we will simulate the Field Jobs in the frontend by simply looking for jobs that contain the worker's name in the raw text, or just displaying the main 'In Progress' pipeline.
