const { adminSupabase } = require('../config/supabaseConfig');

async function addGradeLevelColumn() {
  try {
    console.log('Adding grade_level column to topics table if it does not exist...');
    
    // Check if grade_level column exists
    const { data: columnInfo, error: columnError } = await adminSupabase.rpc(
      'check_column_exists',
      { table_name: 'topics', column_name: 'grade_level' }
    );
    
    if (columnError) {
      console.log('Unable to check column existence using RPC. Trying to add column anyway...');
    } else if (columnInfo && columnInfo.exists) {
      console.log('grade_level column already exists in topics table');
      return;
    }
    
    // Add grade_level column to topics table
    const { error } = await adminSupabase.rpc(
      'execute_sql',
      { sql_query: 'ALTER TABLE topics ADD COLUMN IF NOT EXISTS grade_level INTEGER;' }
    );
    
    if (error) {
      console.error('Error adding grade_level column:', error);
      
      // Alternative approach using direct SQL (requires postgres extension)
      console.log('Trying alternative approach with direct SQL...');
      
      try {
        // Try to execute SQL directly if the RPC method failed
        // This is a simplified method and may not work depending on your Supabase setup
        const res = await adminSupabase.from('_sql').select('*').eq('query', 'ALTER TABLE topics ADD COLUMN IF NOT EXISTS grade_level INTEGER;');
        console.log('SQL execution result:', res);
      } catch (sqlError) {
        console.error('Error executing direct SQL:', sqlError);
        console.log('Unable to add column automatically. Please add the grade_level column manually in the Supabase dashboard.');
      }
    } else {
      console.log('grade_level column added successfully!');
    }
  } catch (error) {
    console.error('Error in addGradeLevelColumn script:', error);
  }
}

// Run the function
addGradeLevelColumn()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 