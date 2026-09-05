-- Migration 0016: Add advisors and followed advisors tables
CREATE TABLE IF NOT EXISTS advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  strategy TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  historical_performance TEXT NOT NULL,
  followers_count INTEGER DEFAULT 0,
  avatar_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followed_advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, advisor_id)
);

ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE followed_advisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view advisors"
  ON advisors FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their followed advisors"
  ON followed_advisors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample advisors if none exist
INSERT INTO advisors (name, specialization, strategy, risk_level, historical_performance, followers_count, avatar_url, description)
VALUES 
  ('Alex Morgan', 'Technology & Growth', 'Momentum Growth & AI Sector Rotation', 'Moderate', '+12.4%', 2341, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 'Senior equity strategist focusing on high-growth tech innovators and cloud infrastructure.'),
  ('Marcus Vance', 'Macro & Commodities', 'Global Macro Hedging & Energy Equities', 'Aggressive', '+18.9%', 1890, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 'Specializes in cyclical commodities, precious metals, and sovereign debt hedges.'),
  ('Elena Rostova', 'Dividend & Value', 'Blue-Chip Income & Dividend Aristocrats', 'Conservative', '+8.2%', 3420, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', 'Focuses on capital preservation, steady compound growth, and high-yield dividend aristocrats.')
ON CONFLICT DO NOTHING;
