-- This script safely drops and recreates all policies to avoid errors
-- Run this in the Supabase SQL Editor if you encounter policy-related errors

-- First drop all policies
DO $$ 
BEGIN
  -- Admin policies
  BEGIN DROP POLICY IF EXISTS "Admins can access all data" ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- User policies
  BEGIN DROP POLICY IF EXISTS "Users can see only their own user profile" ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Users can only update their own profile" ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- Grade policies
  BEGIN DROP POLICY IF EXISTS "Grades are viewable by everyone" ON grades; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Grades can be managed by admins" ON grades; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- User-Grade policies
  BEGIN DROP POLICY IF EXISTS "Users can see only their own grade relationships" ON user_grades; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Admins can manage user-grade relationships" ON user_grades; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Users can select their own grades" ON user_grades; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- Topic policies
  BEGIN DROP POLICY IF EXISTS "Topics are viewable by everyone" ON topics; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Topics can be managed by admins" ON topics; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- Grade-Topic policies
  BEGIN DROP POLICY IF EXISTS "Grade-topic relationships are viewable by everyone" ON grade_topics; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Grade-topic relationships can be managed by admins" ON grade_topics; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- Educational content policies
  BEGIN DROP POLICY IF EXISTS "Educational content is viewable by appropriate grade users" ON educational_content; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Educational content can be managed by admins" ON educational_content; EXCEPTION WHEN undefined_object THEN NULL; END;
  
  -- Also drop legacy policies if they exist
  BEGIN DROP POLICY IF EXISTS admin_insert_self ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_view_all ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_update_self ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS user_insert_self ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS user_view_self ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_view_users ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS user_update_self ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS history_insert_own ON learning_history; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS history_view_own ON learning_history; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_view_history ON learning_history; EXCEPTION WHEN undefined_object THEN NULL; END;
END $$;

-- Re-create all policies for the new schema structure

-- Policies for admins
CREATE POLICY "Admins can access all data" 
  ON admins FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- Policies for users
CREATE POLICY "Users can see only their own user profile" 
  ON users FOR SELECT USING (
    auth.uid() = id OR 
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can only update their own profile" 
  ON users FOR UPDATE USING (
    auth.uid() = id OR 
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    ))
  );

-- Policies for grades
CREATE POLICY "Grades are viewable by everyone" 
  ON grades FOR SELECT USING (true);

CREATE POLICY "Grades can be managed by admins" 
  ON grades FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- Policies for user_grades
CREATE POLICY "Users can see only their own grade relationships" 
  ON user_grades FOR SELECT USING (
    auth.uid() = user_id OR 
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Admins can manage user-grade relationships" 
  ON user_grades FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can select their own grades" 
  ON user_grades FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policies for topics
CREATE POLICY "Topics are viewable by everyone" 
  ON topics FOR SELECT USING (true);

CREATE POLICY "Topics can be managed by admins" 
  ON topics FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- Policies for grade_topics
CREATE POLICY "Grade-topic relationships are viewable by everyone" 
  ON grade_topics FOR SELECT USING (true);

CREATE POLICY "Grade-topic relationships can be managed by admins" 
  ON grade_topics FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- Policies for educational_content
CREATE POLICY "Educational content is viewable by appropriate grade users" 
  ON educational_content FOR SELECT USING (
    -- User can access if they are associated with a grade that has this topic
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM user_grades ug
      JOIN grade_topics gt ON ug.grade_id = gt.grade_id
      JOIN topics t ON gt.topic_id = t.id
      WHERE ug.user_id = auth.uid() 
      AND t.id = educational_content.topic_id
    )) OR
    -- Or if they are an admin
    (auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Educational content can be managed by admins" 
  ON educational_content FOR ALL USING (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

-- Show success message
SELECT 'All policies have been recreated successfully for the new database structure' as message; 