-- =============================================
-- Migration: Auto-Create User Profile on Signup
-- Description: Creates a trigger to automatically create a profile entry when a user signs up
-- Purpose: Prevents foreign key constraint violations in favorites, recipes, collections, etc.
-- =============================================

-- =============================================
-- Function: Auto-create profile on user signup
-- Purpose: Automatically creates a profile record when a new user signs up
-- Trigger: Fires after insert on auth.users
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, created_at, updated_at)
  values (
    new.id,
    new.email,
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user is 'Automatically creates a profile entry when a new user signs up via Supabase Auth';

-- =============================================
-- Trigger: Create profile on new user
-- Purpose: Fires after a new user is created in auth.users
-- =============================================

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Note: Can't add comment on auth.users trigger due to ownership permissions
