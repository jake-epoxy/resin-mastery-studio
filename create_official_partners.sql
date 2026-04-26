-- Execute this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.official_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    full_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    selected_route TEXT NOT NULL,
    signature_data TEXT NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.official_partners ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (so the component can save the contract)
CREATE POLICY "Allow public inserts" ON public.official_partners
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users (like Jake) to select/read the data
CREATE POLICY "Allow authenticated read access" ON public.official_partners
    FOR SELECT
    TO authenticated
    USING (true);
