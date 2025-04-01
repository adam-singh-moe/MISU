const { supabase } = require('../config/supabaseConfig');

async function updateTopicsWithGradeLevels() {
  try {
    console.log('Updating topics with grade levels information...');
    
    // Get all topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, title')
      .order('title');
      
    if (topicsError) {
      throw new Error(`Error fetching topics: ${topicsError.message}`);
    }
    
    console.log(`Found ${topics.length} topics`);
    
    // Get all grade-topic relationships
    const { data: gradeTopics, error: gradeTopicsError } = await supabase
      .from('grade_topics')
      .select(`
        topic_id,
        grades!grade_id(id, level)
      `);
      
    if (gradeTopicsError) {
      throw new Error(`Error fetching grade-topic relationships: ${gradeTopicsError.message}`);
    }
    
    console.log(`Found ${gradeTopics.length} grade-topic relationships`);
    
    // Create a map of topic_id to grade levels
    const topicGradeMap = {};
    gradeTopics.forEach(relation => {
      if (relation.grades && relation.grades.level) {
        if (!topicGradeMap[relation.topic_id]) {
          topicGradeMap[relation.topic_id] = [];
        }
        topicGradeMap[relation.topic_id].push(relation.grades.level);
      }
    });
    
    // Update each topic with grade level info
    for (const topic of topics) {
      const grades = topicGradeMap[topic.id] || [];
      const gradeLevel = grades.length > 0 ? Math.min(...grades) : null;
      
      if (gradeLevel) {
        console.log(`Updating topic "${topic.title}" with grade level ${gradeLevel}`);
        
        const { error: updateError } = await supabase
          .from('topics')
          .update({ grade_level: gradeLevel })
          .eq('id', topic.id);
          
        if (updateError) {
          console.error(`Error updating topic ${topic.id}: ${updateError.message}`);
        }
      } else {
        console.log(`Topic "${topic.title}" has no associated grades`);
      }
    }
    
    console.log('Topics updated successfully!');
  } catch (error) {
    console.error('Error updating topics:', error);
  }
}

// Run the update function
updateTopicsWithGradeLevels()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 