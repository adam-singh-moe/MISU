-- Remove password field constraint or drop the column if using Supabase Auth
-- Choose ONE of the following approaches:

-- OPTION 1: Make password nullable (if you want to keep existing data)
ALTER TABLE admins ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- OPTION 2: Remove password column entirely (if you don't need it anymore)
-- ALTER TABLE admins DROP COLUMN password;
-- ALTER TABLE users DROP COLUMN password;

-- Check if tables exist in the expected format
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_name IN ('admins', 'users')
ORDER BY 
  table_name, 
  ordinal_position; 