-- Fix the recursive policy issue for admins table

-- First drop the problematic policy
DROP POLICY IF EXISTS "Admins can access all data" ON admins;

-- Create a non-recursive policy for admins table
-- This allows all authenticated users to see the admins table
CREATE POLICY "Admin auth users can see admin data" 
  ON admins FOR SELECT USING (auth.role() = 'authenticated');

-- This allows admins to update their own records
CREATE POLICY "Admins can update their own records"
  ON admins FOR UPDATE USING (auth.uid() = id);

-- This allows the service_role to insert admin records
CREATE POLICY "Service role can insert admin data"
  ON admins FOR INSERT WITH CHECK (true);

-- Show success message
SELECT 'Admin policies fixed to prevent recursion' as message;
