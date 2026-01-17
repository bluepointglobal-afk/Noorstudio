-- Create profiles table to hold user data and credits
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  character_credits INTEGER DEFAULT 30,
  book_credits INTEGER DEFAULT 50,
  plan TEXT DEFAULT 'author',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are readable by the owner
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Profiles are only updatable by service role or system functions (for credits)
-- But we allow users to update their own basic info if needed
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic credit deduction RPC
CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_id UUID,
  credit_type TEXT,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF credit_type = 'character_credits' THEN
    UPDATE public.profiles
    SET character_credits = character_credits - amount
    WHERE id = user_id AND character_credits >= amount;
  ELSIF credit_type = 'book_credits' THEN
    UPDATE public.profiles
    SET book_credits = book_credits - amount
    WHERE id = user_id AND book_credits >= amount;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
