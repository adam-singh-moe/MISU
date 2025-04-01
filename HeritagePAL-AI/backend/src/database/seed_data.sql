-- Insert grades if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM grades WHERE level = 1) THEN
    INSERT INTO grades (level, name, description) VALUES (1, 'Grade 1', 'First grade primary school students');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM grades WHERE level = 2) THEN
    INSERT INTO grades (level, name, description) VALUES (2, 'Grade 2', 'Second grade primary school students');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM grades WHERE level = 3) THEN
    INSERT INTO grades (level, name, description) VALUES (3, 'Grade 3', 'Third grade primary school students');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM grades WHERE level = 4) THEN
    INSERT INTO grades (level, name, description) VALUES (4, 'Grade 4', 'Fourth grade primary school students');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM grades WHERE level = 5) THEN
    INSERT INTO grades (level, name, description) VALUES (5, 'Grade 5', 'Fifth grade primary school students');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM grades WHERE level = 6) THEN
    INSERT INTO grades (level, name, description) VALUES (6, 'Grade 6', 'Sixth grade primary school students');
  END IF;
END $$;

-- Insert topics for Guyanese Social Studies
DO $$
DECLARE
    topic_id UUID;
BEGIN
    -- Grade 1-2 Topics
    
    -- Topic 1: My Family
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'My Family') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('My Family', 'All about families in Guyana', 'Families in Guyana come in different sizes and structures. Family members have different roles and responsibilities. Family traditions are important in Guyanese culture.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 1 and 2
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (1, 2);
    END IF;
    
    -- Topic 2: My School
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'My School') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('My School', 'Learning about schools and education', 'Schools are places where children learn and grow. In Guyana, education is important for every child. Schools help students develop skills for the future.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 1 and 2
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (1, 2);
    END IF;
    
    -- Topic 3: Our Community
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Our Community') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Our Community', 'Understanding our local community', 'Communities in Guyana have different people who work together. Community helpers like teachers, doctors, and police officers help keep communities safe and functioning.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 1, 2 and 3
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (1, 2, 3);
    END IF;
    
    -- Grade 3-4 Topics
    
    -- Topic 4: Guyanese Culture
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Guyanese Culture') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Guyanese Culture', 'The diverse cultures of Guyana', 'Guyana has a rich cultural heritage influenced by Indigenous peoples, Africans, Indians, Chinese, and Europeans. This diversity is seen in our food, festivals, music, and traditions.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 3 and 4
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (3, 4);
    END IF;
    
    -- Topic 5: Natural Resources
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Natural Resources') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Natural Resources', 'Guyana''s valuable natural resources', 'Guyana is rich in natural resources including bauxite, gold, diamonds, timber, and more recently, oil. These resources are important for Guyana''s development and economy.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 3, 4 and 5
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (3, 4, 5);
    END IF;
    
    -- Topic 6: Geography of Guyana
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Geography of Guyana') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Geography of Guyana', 'The physical features of Guyana', 'Guyana is divided into four natural regions: the coastal plain, the sand belt, the highland region, and the interior savannah. Each region has unique characteristics and resources.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 3, 4 and 5
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (3, 4, 5);
    END IF;
    
    -- Grade 5-6 Topics
    
    -- Topic 7: Government and Citizenship
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Government and Citizenship') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Government and Citizenship', 'Understanding Guyana''s government structure', 'Guyana is a democratic republic with three branches of government: executive, legislative, and judicial. Citizens have rights and responsibilities in maintaining democracy.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 5 and 6
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (5, 6);
    END IF;
    
    -- Topic 8: Guyanese History
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Guyanese History') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Guyanese History', 'The history of Guyana from pre-colonial times to independence', 'Guyana''s history includes indigenous settlements, European colonization by the Dutch and British, slavery and indentureship, the struggle for independence, and development as a nation.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 5 and 6
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (5, 6);
    END IF;
    
    -- Topic 9: Agriculture and Industry
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Agriculture and Industry') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Agriculture and Industry', 'Guyana''s agricultural and industrial sectors', 'Agriculture is a major part of Guyana''s economy, with rice and sugar being important crops. Industry includes mining, timber processing, and manufacturing.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 5 and 6
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (5, 6);
    END IF;
    
    -- Topic 10: Environmental Conservation
    IF NOT EXISTS (SELECT 1 FROM topics WHERE title = 'Environmental Conservation') THEN
        INSERT INTO topics (title, description, content) 
        VALUES ('Environmental Conservation', 'Protecting Guyana''s natural environment', 'Guyana is home to vast rainforests and diverse wildlife. Conservation efforts aim to protect these natural resources while allowing for sustainable development.')
        RETURNING id INTO topic_id;
        
        -- Link to grades 4, 5 and 6
        INSERT INTO grade_topics (grade_id, topic_id)
        SELECT id, topic_id FROM grades WHERE level IN (4, 5, 6);
    END IF;
    
    -- Add educational content for each topic
    INSERT INTO educational_content (title, topic_id, content_type, processed_content)
    SELECT 'Introduction to ' || t.title, t.id, 'text', 'This is a basic introduction to the topic of ' || t.title || '. ' || t.content
    FROM topics t
    WHERE NOT EXISTS (
        SELECT 1 FROM educational_content WHERE title = 'Introduction to ' || t.title
    );
END $$; 