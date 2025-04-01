# SQL Script Execution Instructions for HeritagePAL-AI

This guide will walk you through running the SQL scripts in the correct order to set up your Supabase database properly.

## Issue with Policy Syntax

PostgreSQL/Supabase doesn't support `IF NOT EXISTS` for policies (unlike tables and other objects), which caused the error you encountered. The updated scripts work around this limitation.

## Step 1: Create Tables and Schema

First, run the basic schema creation script without policies:

1. Go to the [Supabase SQL Editor](https://app.supabase.io)
2. Select your project
3. Create a new query and paste only the **first part** of the `schema.sql` file:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_history ENABLE ROW LEVEL SECURITY;

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  password TEXT DEFAULT 'managed-by-supabase-auth', -- Default value to avoid null constraint issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  password TEXT DEFAULT 'managed-by-supabase-auth', -- Default value to avoid null constraint issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If migrating from an older schema with a password column, make it nullable and add default
ALTER TABLE IF EXISTS admins ALTER COLUMN password SET DEFAULT 'managed-by-supabase-auth';
ALTER TABLE IF EXISTS users ALTER COLUMN password SET DEFAULT 'managed-by-supabase-auth';
```

4. Run this query

## Step 2: Fix Email Confirmation Issues

1. Create a new query
2. Paste the contents of `fix_email_confirmation.sql` 
3. Run this query
4. Check the results to see if users were fixed

## Step 3: Create Policies

1. Create a new query
2. Paste the contents of `fix_policy_errors.sql`
3. Run this query
4. Check the success message

## Step 4: Verify Database Setup

Run the following query to check that everything is set up correctly:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check user accounts
SELECT 
    COUNT(*) as "Total auth users",
    SUM(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as "Confirmed emails"
FROM 
    auth.users;
```

## Troubleshooting

If you encounter errors with policies:

1. Policies can't be created with `IF NOT EXISTS` (unlike tables)
2. You may need to manually drop a policy before recreating it
3. The `fix_policy_errors.sql` script handles this by first dropping then recreating all policies

If you continue to encounter issues, you can run the individual parts of the scripts separately. 