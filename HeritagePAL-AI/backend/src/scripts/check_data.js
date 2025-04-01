const { adminSupabase } = require('../config/supabaseConfig');

async function checkGradeTopics() {
  try {
    console.log('Checking grade-topic relationships...');
    
    // Get all grades
    const { data: grades } = await adminSupabase
      .from('grades')
      .select('id, level, name')
      .order('level');
      
    for (const grade of grades) {
      console.log(`\n=== Topics for ${grade.name} (Level ${grade.level}) ===`);
      
      // Get topics for this grade
      const { data: gradeTopics, error } = await adminSupabase
        .from('grade_topics')
        .select(`
          topics!topic_id (id, title, description)
        `)
        .eq('grade_id', grade.id);
        
      if (error) {
        console.error(`Error retrieving topics for grade ${grade.level}:`, error);
        continue;
      }
      
      if (!gradeTopics || gradeTopics.length === 0) {
        console.log(`No topics found for ${grade.name}`);
        continue;
      }
      
      // Display topics
      const topics = gradeTopics.map(gt => gt.topics);
      topics.forEach((topic, i) => {
        console.log(`${i+1}. ${topic.title} - ${topic.description}`);
      });
    }
    
    console.log('\nChecking educational content...');
    const { data: content, error: contentError } = await adminSupabase
      .from('educational_content')
      .select('id, title, topic_id, topics!topic_id(title)')
      .limit(10);
      
    if (contentError) {
      console.error('Error retrieving educational content:', contentError);
    } else if (!content || content.length === 0) {
      console.log('No educational content found');
    } else {
      console.log(`\nFound ${content.length} educational content items:`);
      content.forEach((item, i) => {
        console.log(`${i+1}. ${item.title} (Topic: ${item.topics?.title || 'Unknown'})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

// Run the check
checkGradeTopics()
  .then(() => {
    console.log('\nCheck completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 