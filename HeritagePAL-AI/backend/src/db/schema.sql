-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grade_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS practice_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_topic_history ENABLE ROW LEVEL SECURITY;

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

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  level INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user-grade relationship table
CREATE TABLE IF NOT EXISTS user_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, grade_id)
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create grade-topic relationship table
CREATE TABLE IF NOT EXISTS grade_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(grade_id, topic_id)
);

-- Create educational_content table
CREATE TABLE IF NOT EXISTS educational_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  raw_content TEXT,
  processed_content TEXT NOT NULL,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_chat_sessions table
CREATE TABLE IF NOT EXISTS user_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  topic_id UUID REFERENCES topics(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL,
  questions TEXT NOT NULL, -- JSON format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admins(id)
);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id),
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice_exams table
CREATE TABLE IF NOT EXISTS practice_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  questions TEXT NOT NULL, -- JSON format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flashcard_sessions table
CREATE TABLE IF NOT EXISTS flashcard_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  topic_id UUID REFERENCES topics(id),
  flashcard_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_topic_history table
CREATE TABLE IF NOT EXISTS user_topic_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  topic_id UUID REFERENCES topics(id) NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If migrating from an older schema with a password column, make it nullable and add default
ALTER TABLE IF EXISTS admins ALTER COLUMN password SET DEFAULT 'managed-by-supabase-auth';
ALTER TABLE IF EXISTS users ALTER COLUMN password SET DEFAULT 'managed-by-supabase-auth';

-- Drop existing policies to avoid errors (PostgreSQL doesn't support IF NOT EXISTS for policies)
DO $$ 
BEGIN
  -- Drop existing policies
  -- Admin policies
  BEGIN DROP POLICY IF EXISTS admin_insert_self ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_view_all ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_update_self ON admins; EXCEPTION WHEN undefined_object THEN NULL; END;

  -- User policies
  BEGIN DROP POLICY IF EXISTS user_insert_self ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS user_view_self ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS admin_view_users ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS user_update_self ON users; EXCEPTION WHEN undefined_object THEN NULL; END;
  
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
END $$;

-- Create RLS Policies

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

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE id = auth.uid()
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Populate default grades
INSERT INTO grades (level, name, description)
SELECT level, 'Grade ' || level, 'Grade ' || level || ' curriculum'
FROM generate_series(1, 6) AS level
WHERE NOT EXISTS (
  SELECT 1 FROM grades WHERE level = generate_series.level
);

-- Output success message
SELECT 'Schema created successfully with grade structure' as message; 