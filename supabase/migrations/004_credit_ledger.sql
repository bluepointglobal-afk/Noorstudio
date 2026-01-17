-- Credit Ledger Table
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'character', 'book'
  amount INTEGER NOT NULL, -- Negative for consumption, positive for addition
  reason TEXT NOT NULL,
  entity_type TEXT, -- 'project', 'character', 'system'
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Users can view own ledger
CREATE POLICY "Users can view own ledger" 
  ON public.credit_ledger FOR SELECT 
  USING (auth.uid() = user_id);

-- Update deductCredits RPC to also add ledger entry
CREATE OR REPLACE FUNCTION public.deduct_credits_v2(
  p_user_id UUID,
  p_credit_type TEXT,
  p_amount INTEGER,
  p_reason TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Deduct from profile
  IF p_credit_type = 'character_credits' THEN
    UPDATE public.profiles
    SET character_credits = character_credits - p_amount
    WHERE id = p_user_id AND character_credits >= p_amount;
  ELSIF p_credit_type = 'book_credits' THEN
    UPDATE public.profiles
    SET book_credits = book_credits - p_amount
    WHERE id = p_user_id AND book_credits >= p_amount;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Add ledger entry
  INSERT INTO public.credit_ledger (
    user_id, type, amount, reason, entity_type, entity_id, metadata
  ) VALUES (
    p_user_id, 
    REPLACE(p_credit_type, '_credits', ''), 
    -p_amount, 
    p_reason, 
    p_entity_type, 
    p_entity_id, 
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
