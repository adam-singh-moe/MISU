-- SQL to update the topics table to match the new structure with grade relationships
-- First, create a backup of the existing topics table
CREATE TABLE topics_backup AS SELECT * FROM topics;

-- Drop the existing topics table (will also drop any related constraints)
DROP TABLE IF EXISTS topics CASCADE;

-- Create the new topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create the grades table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
  level INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the grade-topic relationship table
CREATE TABLE IF NOT EXISTS grade_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(grade_id, topic_id)
);

-- Populate default grades if they don't exist
INSERT INTO grades (level, name, description)
SELECT level, 'Grade ' || level, 'Grade ' || level || ' curriculum'
FROM generate_series(1, 6) AS level
WHERE NOT EXISTS (
  SELECT 1 FROM grades WHERE level = generate_series.level
);

-- If migrating data, insert the topics from backup
-- INSERT INTO topics (id, title, description, content, created_at)
-- SELECT id, name, description, '', created_at FROM topics_backup;

-- If migrating data and topics had a grade field, create the relationships
-- INSERT INTO grade_topics (grade_id, topic_id)
-- SELECT g.id, t.id
-- FROM topics_backup t
-- JOIN grades g ON g.level = t.grade; 