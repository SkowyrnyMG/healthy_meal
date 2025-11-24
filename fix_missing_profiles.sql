-- Create profiles for any existing auth.users that don't have a profile entry
INSERT INTO public.profiles (user_id, email, created_at, updated_at)
SELECT u.id, u.email, u.created_at, now()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;
