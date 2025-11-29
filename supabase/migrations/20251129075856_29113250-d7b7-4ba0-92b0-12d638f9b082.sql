-- Create external API keys and usage tracking tables

CREATE TABLE IF NOT EXISTS external_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  organization_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free', -- free, basic, premium, enterprise
  rate_limit_per_minute INTEGER DEFAULT 10,
  rate_limit_per_day INTEGER DEFAULT 1000,
  monthly_quota INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES external_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_tokens INTEGER DEFAULT 0,
  response_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS external_api_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES external_api_keys(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  tier TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue
  invoice_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE external_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_api_billing ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage external API keys"
ON external_api_keys FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view usage"
ON external_api_usage FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage billing"
ON external_api_billing FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_external_api_keys_key ON external_api_keys(api_key);
CREATE INDEX idx_external_api_keys_active ON external_api_keys(is_active);
CREATE INDEX idx_external_api_usage_key_id ON external_api_usage(api_key_id);
CREATE INDEX idx_external_api_usage_created_at ON external_api_usage(created_at);
CREATE INDEX idx_external_api_billing_key_id ON external_api_billing(api_key_id);

-- Trigger for updated_at
CREATE TRIGGER update_external_api_keys_updated_at
BEFORE UPDATE ON external_api_keys
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  _api_key_id UUID,
  _rate_limit_per_minute INTEGER,
  _rate_limit_per_day INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  minute_count INTEGER;
  day_count INTEGER;
BEGIN
  -- Check minute limit
  SELECT COUNT(*) INTO minute_count
  FROM external_api_usage
  WHERE api_key_id = _api_key_id
    AND created_at > now() - interval '1 minute';
  
  IF minute_count >= _rate_limit_per_minute THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily limit
  SELECT COUNT(*) INTO day_count
  FROM external_api_usage
  WHERE api_key_id = _api_key_id
    AND created_at > now() - interval '1 day';
  
  IF day_count >= _rate_limit_per_day THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;