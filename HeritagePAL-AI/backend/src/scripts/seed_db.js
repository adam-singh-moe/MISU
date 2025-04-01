const { adminSupabase } = require('../config/supabaseConfig');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Insert grades
    const grades = [
      { level: 1, name: 'Grade 1', description: 'First grade primary school students' },
      { level: 2, name: 'Grade 2', description: 'Second grade primary school students' },
      { level: 3, name: 'Grade 3', description: 'Third grade primary school students' },
      { level: 4, name: 'Grade 4', description: 'Fourth grade primary school students' },
      { level: 5, name: 'Grade 5', description: 'Fifth grade primary school students' },
      { level: 6, name: 'Grade 6', description: 'Sixth grade primary school students' }
    ];
    
    for (const grade of grades) {
      // Check if grade exists
      const { data: existingGrade } = await adminSupabase
        .from('grades')
        .select('id')
        .eq('level', grade.level)
        .maybeSingle();
        
      if (!existingGrade) {
        console.log(`Inserting grade ${grade.level}...`);
        await adminSupabase.from('grades').insert(grade);
      } else {
        console.log(`Grade ${grade.level} already exists, skipping...`);
      }
    }
    
    // Get all grades for reference
    const { data: allGrades } = await adminSupabase
      .from('grades')
      .select('id, level')
      .order('level');
      
    // Create a map of grade level to id
    const gradeMap = {};
    allGrades.forEach(grade => {
      gradeMap[grade.level] = grade.id;
    });
    
    // Topics data with grade assignments
    const topics = [
      { 
        title: 'My Family', 
        description: 'All about families in Guyana', 
        content: 'Families in Guyana come in different sizes and structures. Family members have different roles and responsibilities. Family traditions are important in Guyanese culture.',
        grades: [1, 2]
      },
      { 
        title: 'My School', 
        description: 'Learning about schools and education', 
        content: 'Schools are places where children learn and grow. In Guyana, education is important for every child. Schools help students develop skills for the future.',
        grades: [1, 2]
      },
      { 
        title: 'Our Community', 
        description: 'Understanding our local community', 
        content: 'Communities in Guyana have different people who work together. Community helpers like teachers, doctors, and police officers help keep communities safe and functioning.',
        grades: [1, 2, 3]
      },
      { 
        title: 'Guyanese Culture', 
        description: 'The diverse cultures of Guyana', 
        content: 'Guyana has a rich cultural heritage influenced by Indigenous peoples, Africans, Indians, Chinese, and Europeans. This diversity is seen in our food, festivals, music, and traditions.',
        grades: [3, 4]
      },
      { 
        title: 'Natural Resources', 
        description: 'Guyana\'s valuable natural resources', 
        content: 'Guyana is rich in natural resources including bauxite, gold, diamonds, timber, and more recently, oil. These resources are important for Guyana\'s development and economy.',
        grades: [3, 4, 5]
      },
      { 
        title: 'Geography of Guyana', 
        description: 'The physical features of Guyana', 
        content: 'Guyana is divided into four natural regions: the coastal plain, the sand belt, the highland region, and the interior savannah. Each region has unique characteristics and resources.',
        grades: [3, 4, 5]
      },
      { 
        title: 'Government and Citizenship', 
        description: 'Understanding Guyana\'s government structure', 
        content: 'Guyana is a democratic republic with three branches of government: executive, legislative, and judicial. Citizens have rights and responsibilities in maintaining democracy.',
        grades: [5, 6]
      },
      { 
        title: 'Guyanese History', 
        description: 'The history of Guyana from pre-colonial times to independence', 
        content: 'Guyana\'s history includes indigenous settlements, European colonization by the Dutch and British, slavery and indentureship, the struggle for independence, and development as a nation.',
        grades: [5, 6]
      },
      { 
        title: 'Agriculture and Industry', 
        description: 'Guyana\'s agricultural and industrial sectors', 
        content: 'Agriculture is a major part of Guyana\'s economy, with rice and sugar being important crops. Industry includes mining, timber processing, and manufacturing.',
        grades: [5, 6]
      },
      { 
        title: 'Environmental Conservation', 
        description: 'Protecting Guyana\'s natural environment', 
        content: 'Guyana is home to vast rainforests and diverse wildlife. Conservation efforts aim to protect these natural resources while allowing for sustainable development.',
        grades: [4, 5, 6]
      }
    ];
    
    // Insert topics and create grade-topic relationships
    for (const topic of topics) {
      // Check if topic exists
      const { data: existingTopic } = await adminSupabase
        .from('topics')
        .select('id')
        .eq('title', topic.title)
        .maybeSingle();
        
      let topicId;
      
      if (!existingTopic) {
        console.log(`Inserting topic "${topic.title}"...`);
        // Extract the grades from the topic and leave only the data for the topics table
        const { grades, ...topicData } = topic;
        
        const { data: newTopic, error } = await adminSupabase
          .from('topics')
          .insert(topicData)
          .select('id')
          .single();
          
        if (error) {
          console.error(`Error inserting topic "${topic.title}":`, error);
          continue;
        }
        
        topicId = newTopic.id;
        
        // Create grade-topic relationships
        for (const gradeLevel of topic.grades) {
          const gradeId = gradeMap[gradeLevel];
          if (gradeId) {
            console.log(`Linking topic "${topic.title}" to grade ${gradeLevel}...`);
            await adminSupabase
              .from('grade_topics')
              .insert({ grade_id: gradeId, topic_id: topicId });
          }
        }
        
        // Create sample educational content for this topic
        await adminSupabase
          .from('educational_content')
          .insert({
            title: `Introduction to ${topic.title}`,
            topic_id: topicId,
            content_type: 'text',
            processed_content: `This is a basic introduction to the topic of ${topic.title}. ${topic.content}`
          });
      } else {
        console.log(`Topic "${topic.title}" already exists, checking grade assignments...`);
        topicId = existingTopic.id;
        
        // Check and create missing grade-topic relationships
        for (const gradeLevel of topic.grades) {
          const gradeId = gradeMap[gradeLevel];
          
          if (gradeId) {
            // Check if relationship exists
            const { data: existingRelation } = await adminSupabase
              .from('grade_topics')
              .select('id')
              .eq('grade_id', gradeId)
              .eq('topic_id', topicId)
              .maybeSingle();
              
            if (!existingRelation) {
              console.log(`Linking topic "${topic.title}" to grade ${gradeLevel}...`);
              await adminSupabase
                .from('grade_topics')
                .insert({ grade_id: gradeId, topic_id: topicId });
            }
          }
        }
        
        // Check if educational content exists
        const { data: existingContent } = await adminSupabase
          .from('educational_content')
          .select('id')
          .eq('topic_id', topicId)
          .eq('title', `Introduction to ${topic.title}`)
          .maybeSingle();
          
        if (!existingContent) {
          console.log(`Creating educational content for topic "${topic.title}"...`);
          await adminSupabase
            .from('educational_content')
            .insert({
              title: `Introduction to ${topic.title}`,
              topic_id: topicId,
              content_type: 'text',
              processed_content: `This is a basic introduction to the topic of ${topic.title}. ${topic.content}`
            });
        }
      }
    }
    
    console.log('Database seeding completed successfully!');
    
    // Display summary of data in database
    await displayDatabaseSummary();
    
  } catch (error) {
    console.error('Exception during database seeding:', error);
  }
}

async function displayDatabaseSummary() {
  // Verify data was inserted
  const { data: grades, error: gradesError } = await adminSupabase
    .from('grades')
    .select('level, name')
    .order('level');
    
  if (gradesError) {
    console.error('Error retrieving grades:', gradesError);
  } else {
    console.log('Grades in database:', grades.length);
    console.table(grades);
  }
  
  const { data: topics, error: topicsError } = await adminSupabase
    .from('topics')
    .select('title, description')
    .order('title');
    
  if (topicsError) {
    console.error('Error retrieving topics:', topicsError);
  } else {
    console.log('Topics in database:', topics.length);
    console.table(topics);
  }
  
  try {
    const { data: gradeTopics, error: gradeTopicsError } = await adminSupabase
      .from('grade_topics')
      .select(`
        grades!grade_id (level),
        topics!topic_id (title)
      `);
      
    if (gradeTopicsError) {
      console.error('Error retrieving grade-topic relationships:', gradeTopicsError);
    } else {
      console.log('Grade-Topic relationships in database:', gradeTopics.length);
      // Format for better display
      const formattedRelationships = gradeTopics.map(relation => ({
        grade: relation.grades?.level || 'Unknown',
        topic: relation.topics?.title || 'Unknown'
      }));
      console.table(formattedRelationships);
    }
  } catch (error) {
    console.error('Error formatting grade-topic relationships:', error);
  }
}

// Execute the seeding function
seedDatabase()
  .then(() => {
    console.log('Seed script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error in seed script:', err);
    process.exit(1);
  }); 