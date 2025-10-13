-- =============================================
-- Migration: Disable RLS on profiles table for Development
-- Description: Disables RLS on profiles table to allow API access with mock user IDs
-- Purpose: Allow API access during development without authentication
-- WARNING: This is for development only! Enable proper RLS policies in production!
-- =============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'RLS disabled on profiles table for development';
  RAISE NOTICE 'WARNING: Re-enable RLS with proper policies before production deployment!';
END $$;
