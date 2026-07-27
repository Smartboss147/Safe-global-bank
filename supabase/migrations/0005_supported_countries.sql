CREATE TABLE IF NOT EXISTS public.supported_countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_name TEXT NOT NULL UNIQUE,
    currency_code TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.supported_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on supported_countries" 
ON public.supported_countries FOR SELECT 
USING (true);

CREATE POLICY "Enable insert/update/delete for admins only on supported_countries" 
ON public.supported_countries FOR ALL 
USING (auth.role() = 'authenticated' AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Seed data
INSERT INTO public.supported_countries (country_name, currency_code, currency_symbol, is_active)
VALUES 
    ('United States', 'USD', '$', true),
    ('European Union', 'EUR', '€', true),
    ('United Kingdom', 'GBP', '£', true),
    ('Nigeria', 'NGN', '₦', true),
    ('Ghana', 'GHS', 'GH₵', true),
    ('Kenya', 'KES', 'KSh', true),
    ('South Africa', 'ZAR', 'R', true),
    ('Canada', 'CAD', 'CA$', true)
ON CONFLICT (country_name) DO NOTHING;
