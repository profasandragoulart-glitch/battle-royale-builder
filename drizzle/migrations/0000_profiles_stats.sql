CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL,
  kills integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  matches_played integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users update own username" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (username) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1), 'Jogador'), 20));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.record_match(_kills integer, _won boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.profiles SET
    kills = kills + LEAST(GREATEST(_kills,0), 9),
    wins = wins + CASE WHEN _won THEN 1 ELSE 0 END,
    matches_played = matches_played + 1
  WHERE id = auth.uid();
END $$;
REVOKE EXECUTE ON FUNCTION public.record_match(integer, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_match(integer, boolean) TO authenticated;