-- AI Usage Telemetry Table
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'claude', 'nanobanana', 'mock'
  stage TEXT NOT NULL,    -- 'outline', 'chapters', 'illustrations', etc.
  request_type TEXT NOT NULL, -- 'text', 'image'
  tokens_in INTEGER,
  tokens_out INTEGER,
  credits_charged INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_code TEXT,
  metadata JSONB,         -- Stores prompt hints, model used, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Usage data is readable by the owner
CREATE POLICY "Users can view own AI usage" 
  ON public.ai_usage FOR SELECT 
  USING (auth.uid() = user_id);

-- Only service role can insert (handled by server)
-- Note: In a real app, you might want more complex policies, 
-- but for hardening we trust the server-side service role.
