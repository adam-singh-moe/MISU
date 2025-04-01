-- This script helps fix common issues with email confirmation and password handling
-- Run this in the Supabase SQL Editor (https://app.supabase.io/project/_/sql)

-- 1. Add default value for password fields to avoid not-null constraint issues
ALTER TABLE admins ALTER COLUMN password SET DEFAULT 'managed-by-supabase-auth';
ALTER TABLE users ALTER COLUMN password SET DEFAULT 'managed-by-supabase-auth';

-- 2. Confirm all existing emails in the auth.users table
-- This will allow all existing users to log in without email confirmation
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id, email, email_confirmed_at 
        FROM auth.users 
        WHERE email_confirmed_at IS NULL
    LOOP
        -- Update the user's email_confirmed_at timestamp
        UPDATE auth.users
        SET email_confirmed_at = NOW()
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Confirmed email for user: % (ID: %)', user_record.email, user_record.id;
    END LOOP;
END $$;

-- 3. Fill in any missing admin records for users who exist in auth.users but not in the admins table
-- First, create a temporary table to store user IDs that need to be inserted
CREATE TEMP TABLE IF NOT EXISTS users_to_add AS
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', 'Admin User') as name,
    au.email,
    'admin' as role,
    'managed-by-supabase-auth' as password,
    COALESCE(au.created_at, NOW()) as created_at
FROM 
    auth.users au
LEFT JOIN 
    admins a ON au.id = a.id
LEFT JOIN
    users u ON au.id = u.id
WHERE 
    a.id IS NULL -- Only for users not already in admins table
    AND u.id IS NULL -- And not in users table
LIMIT 100; -- Limit to avoid hitting statement timeouts

-- Now insert the users
INSERT INTO admins (id, name, email, role, password, created_at)
SELECT id, name, email, role, password, created_at FROM users_to_add
ON CONFLICT (id) DO NOTHING; -- Avoid duplicate key errors

-- 4. Show summary
SELECT 'Repair summary:' as message;

SELECT 
    COUNT(*) as "Total auth users",
    SUM(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as "Confirmed emails",
    SUM(CASE WHEN email_confirmed_at IS NULL THEN 1 ELSE 0 END) as "Unconfirmed emails"
FROM 
    auth.users;

SELECT 
    COUNT(*) as "Admin records"
FROM 
    admins;
    
SELECT 
    COUNT(*) as "User records"
FROM 
    users;

-- Match counts to see if all auth users have corresponding records
SELECT
    (SELECT COUNT(*) FROM auth.users) as "Auth users",
    (SELECT COUNT(*) FROM admins) + (SELECT COUNT(*) FROM users) as "Total application users",
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM admins) + (SELECT COUNT(*) FROM users)
        THEN 'OK - All users accounted for'
        ELSE 'WARNING - User counts don''t match'
    END as "Status"; 