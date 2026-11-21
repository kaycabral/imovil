-- Supabase-owned schemas (auth, storage): only what imovil adds on top of them.

-- 1. Profile row for every new auth user, seeded from the Google identity.
--    SECURITY DEFINER + empty search_path (Supabase's recommended shape for
--    auth triggers); EXECUTE revoked so it is not callable through the API.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();--> statement-breakpoint

-- 2. Public bucket for listing photos: anyone can read through the public URL;
--    size and type limits are enforced by Storage itself.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;--> statement-breakpoint

-- 3. Writes only inside the caller's own folder: `<auth.uid()>/<file>`.
--    SELECT is scoped the same way (needed by upsert/remove); public reads go
--    through the public URL and do not need it.
CREATE POLICY "property-images: owner can read own folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));--> statement-breakpoint

CREATE POLICY "property-images: owner can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));--> statement-breakpoint

CREATE POLICY "property-images: owner can update own folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text))
  WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));--> statement-breakpoint

CREATE POLICY "property-images: owner can delete own folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));
